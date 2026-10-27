from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from data_collection.models import Household, Interview, Respondent
from surveys.models import Survey

from .models import GeneratedReport
from .serializers import GeneratedReportSerializer


class GeneratedReportViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated]
    queryset = GeneratedReport.objects.select_related("survey", "generated_by")

    def get_queryset(self):
        queryset = super().get_queryset()
        survey_id = self.request.query_params.get("survey")
        report_type = self.request.query_params.get("type")
        if survey_id and survey_id != "all":
            queryset = queryset.filter(survey_id=survey_id)
        if report_type:
            queryset = queryset.filter(report_type=report_type)
        return queryset


class GenerateReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        report_type = request.data.get("report_type")
        report_type_labels = dict(GeneratedReport.ReportType.choices)
        if report_type not in report_type_labels:
            return Response({"report_type": "Choose a supported report type."}, status=status.HTTP_400_BAD_REQUEST)

        survey_id = request.data.get("survey")
        survey = None
        if survey_id and str(survey_id).lower() != "all":
            try:
                survey = Survey.objects.get(pk=survey_id)
            except (Survey.DoesNotExist, ValueError, TypeError):
                return Response({"survey": "Select a valid survey."}, status=status.HTTP_400_BAD_REQUEST)

        households = Household.objects.annotate(member_count=Count("respondents", distinct=True))
        respondents = Respondent.objects.select_related("household")
        interviews = Interview.objects.select_related("survey", "household")
        if survey:
            households = households.filter(survey=survey)
            respondents = respondents.filter(household__survey=survey)
            interviews = interviews.filter(survey=survey)

        household_records = list(households)
        respondent_records = list(respondents)
        interview_records = list(interviews)
        household_count = len(household_records)
        respondent_count = len(respondent_records)
        interview_count = len(interview_records)
        completed_count = sum(item.status == Interview.Status.COMPLETED for item in interview_records)
        completion_rate = round(completed_count / interview_count * 100, 1) if interview_count else 0.0
        summary = {
            "households": household_count,
            "respondents": respondent_count,
            "interviews": interview_count,
            "completed_interviews": completed_count,
            "completion_rate": completion_rate,
        }

        def share(count, total):
            return round(count / total * 100, 1) if total else 0.0

        if report_type == GeneratedReport.ReportType.OVERVIEW:
            data = [
                {"metric": "Survey", "value": survey.name if survey else "All surveys"},
                {"metric": "Survey status", "value": survey.get_status_display() if survey else "All surveys"},
                {"metric": "Households", "value": household_count},
                {"metric": "Respondents", "value": respondent_count},
                {"metric": "Interviews", "value": interview_count},
                {"metric": "Completed interviews", "value": completed_count},
                {"metric": "Interview completion rate (%)", "value": completion_rate},
            ]
        elif report_type == GeneratedReport.ReportType.DEMOGRAPHICS:
            sex_labels = dict(Respondent.Sex.choices)
            sex_counts = {key: sum(item.sex == key for item in respondent_records) for key in sex_labels}
            age_groups = [
                ("0–17", lambda age: age is not None and 0 <= age <= 17),
                ("18–29", lambda age: age is not None and 18 <= age <= 29),
                ("30–44", lambda age: age is not None and 30 <= age <= 44),
                ("45–59", lambda age: age is not None and 45 <= age <= 59),
                ("60+", lambda age: age is not None and age >= 60),
                ("Not reported", lambda age: age is None),
            ]
            data = [
                {"dimension": "Sex", "category": sex_labels[key], "count": count, "share_pct": share(count, respondent_count)}
                for key, count in sex_counts.items()
            ]
            data.extend({
                "dimension": "Age group",
                "category": label,
                "count": count,
                "share_pct": share(count, respondent_count),
            } for label, matches in age_groups
                for count in [sum(matches(item.age) for item in respondent_records)])
        elif report_type == GeneratedReport.ReportType.HOUSEHOLDS:
            data = []
            dimensions = [
                ("District", _count_values(household_records, lambda item: item.district or "Not reported")),
                ("Region", _count_values(household_records, lambda item: item.region or "Not reported")),
                ("Household size", _count_values(household_records, lambda item: _household_size(item.member_count))),
            ]
            for dimension, value_counts in dimensions:
                dimension_total = sum(value_counts.values())
                data.extend({
                    "dimension": dimension,
                    "category": label,
                    "count": count,
                    "share_pct": share(count, dimension_total),
                } for label, count in sorted(value_counts.items(), key=lambda pair: (-pair[1], pair[0])))
        else:
            status_labels = dict(Interview.Status.choices)
            data = [
                {
                    "status": status_labels[key],
                    "count": count,
                    "share_pct": share(count, interview_count),
                }
                for key, count in {
                    key: sum(item.status == key for item in interview_records)
                    for key in status_labels
                }.items()
            ]

        title = f"{report_type_labels[report_type]} — {survey.name if survey else 'All Surveys'}"
        report = GeneratedReport.objects.create(
            title=title,
            report_type=report_type,
            survey=survey,
            survey_name=survey.name if survey else "All surveys",
            data_snapshot=data,
            summary=summary,
            row_count=len(data),
            generated_by=request.user,
        )
        return Response(GeneratedReportSerializer(report).data, status=status.HTTP_201_CREATED)


def _count_values(records, get_value):
    counts = {}
    for record in records:
        label = get_value(record)
        counts[label] = counts.get(label, 0) + 1
    return counts


def _household_size(member_count):
    if member_count == 0:
        return "No members"
    if member_count == 1:
        return "1 member"
    if member_count <= 4:
        return "2–4 members"
    if member_count <= 7:
        return "5–7 members"
    return "8+ members"
