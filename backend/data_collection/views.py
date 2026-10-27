import math
from datetime import date

from django.db import transaction
from django.db.models import Count, DateTimeField
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from surveys.models import Questionnaire, Question, Survey

from .models import CleaningAction, Household, Interview, InterviewResponse, Respondent
from .serializers import HouseholdSerializer, InterviewSerializer, RespondentSerializer


class ValidationIssuesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        issues = []

        def add_issue(record_id, field, issue, severity, module, source_type, source_pk, rule, category):
            issues.append({
                "id": str(record_id),
                "field": field,
                "issue": issue,
                "severity": severity,
                "module": module,
                "key": f"{source_type}:{source_pk}:{rule}",
                "source_type": source_type,
                "source_pk": source_pk,
                "rule": rule,
                "category": category,
            })

        for household in Household.objects.all():
            for field, label in (
                ("district", "District"),
                ("parish", "Parish"),
                ("village_ea", "Village / EA"),
                ("region", "Region"),
            ):
                if not getattr(household, field).strip():
                    add_issue(household.household_id, label, f"{label} is missing.", "Critical", "Households", "household", household.pk, f"{field}_missing", "Missing Data")

        respondents = Respondent.objects.select_related("household")
        for respondent in respondents:
            if respondent.age is None:
                add_issue(respondent.person_id, "Age", "Age has not been recorded.", "Info", "Respondents", "respondent", respondent.pk, "age_missing", "Missing Data")
            if respondent.sex == Respondent.Sex.NOT_REPORTED:
                add_issue(respondent.person_id, "Sex", "Sex has not been reported.", "Info", "Respondents", "respondent", respondent.pk, "sex_not_reported", "Missing Data")

        duplicate_groups = respondents.values("household_id", "name").annotate(
            record_count=Count("id")
        ).filter(record_count__gt=1)
        for duplicate in duplicate_groups:
            matches = respondents.filter(
                household_id=duplicate["household_id"],
                name=duplicate["name"],
            )
            for respondent in matches:
                add_issue(
                    respondent.person_id,
                    "Name",
                    "Possible duplicate name within this household.",
                    "Warning",
                    "Respondents",
                    "respondent",
                    respondent.pk,
                    "duplicate_name",
                    "Duplicates",
                )

        now = timezone.now()
        for interview in Interview.objects.select_related("household", "survey"):
            if interview.household.survey_id != interview.survey_id:
                add_issue(interview.household.household_id, "Survey", "Household belongs to a different survey.", "Critical", "Data Collection", "interview", interview.pk, "survey_mismatch", "Inconsistent")
            if interview.started_at and interview.started_at > now:
                add_issue(interview.household.household_id, "Interview Date", "Interview start date is in the future.", "Warning", "Data Collection", "interview", interview.pk, "future_start", "Inconsistent")
            if interview.status == Interview.Status.COMPLETED and interview.completed_at is None:
                add_issue(interview.household.household_id, "Completed At", "Completed interview has no completion date.", "Critical", "Data Collection", "interview", interview.pk, "missing_completed_at", "Missing Data")
            if interview.completed_at and interview.started_at and interview.completed_at < interview.started_at:
                add_issue(interview.household.household_id, "Completed At", "Completion date is before the start date.", "Critical", "Data Collection", "interview", interview.pk, "date_order", "Inconsistent")

        for survey in Survey.objects.all():
            if survey.start_date and survey.end_date and survey.end_date < survey.start_date:
                add_issue(survey.name, "End Date", "Survey end date is before its start date.", "Warning", "Surveys", "survey", survey.pk, "date_order", "Inconsistent")

        counts = {
            "critical": sum(issue["severity"] == "Critical" for issue in issues),
            "warning": sum(issue["severity"] == "Warning" for issue in issues),
            "info": sum(issue["severity"] == "Info" for issue in issues),
        }
        record_total = max(
            1,
            Survey.objects.count() + Household.objects.count() + Respondent.objects.count() + Interview.objects.count(),
        )
        weighted_issues = counts["critical"] * 10 + counts["warning"] * 5 + counts["info"]
        quality_score = max(0, 100 - round(weighted_issues / record_total * 100))

        return Response({
            "issues": issues,
            "summary": {
                "total": len(issues),
                **counts,
                "quality_score": quality_score,
            },
        })


class DataCleaningView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_issues = ValidationIssuesView().get(request).data["issues"]
        current_by_key = {issue["key"]: issue for issue in current_issues}
        actions = {
            action.issue_key: action
            for action in CleaningAction.objects.all()
        }

        results = []
        for issue in current_issues:
            action = actions.get(issue["key"])
            results.append({
                **issue,
                "status": action.status if action else "open",
                "note": action.note if action else "",
            })

        for key, action in actions.items():
            if key not in current_by_key:
                results.append({
                    "key": key,
                    "id": action.record_id,
                    "field": action.field,
                    "issue": action.issue,
                    "severity": action.severity,
                    "module": action.module,
                    "category": "Cleared",
                    "status": "cleared",
                    "note": action.note,
                })

        return Response({"issues": results, "total": len(results)})

    def post(self, request):
        key = str(request.data.get("key", ""))
        status = request.data.get("status")
        note = str(request.data.get("note", "")).strip()
        if status not in ("open", CleaningAction.Status.REVIEWED, CleaningAction.Status.DISMISSED):
            return Response({"status": "Choose open, reviewed, or dismissed."}, status=400)
        if len(note) > 2000:
            return Response({"note": "Notes must be 2,000 characters or fewer."}, status=400)

        issue = next(
            (item for item in ValidationIssuesView().get(request).data["issues"] if item["key"] == key),
            None,
        )
        if issue is None:
            return Response({"detail": "This issue is no longer current. Refresh the cleaning queue."}, status=404)

        if status == "open":
            CleaningAction.objects.filter(issue_key=key).delete()
            return Response({"key": key, "status": "open", "note": ""})

        action, _ = CleaningAction.objects.update_or_create(
            issue_key=key,
            defaults={
                "record_id": issue["id"],
                "field": issue["field"],
                "issue": issue["issue"],
                "severity": issue["severity"],
                "module": issue["module"],
                "status": status,
                "note": note,
                "updated_by": request.user,
            },
        )
        return Response({"key": action.issue_key, "status": action.status, "note": action.note})


class DataCleaningCorrectionView(APIView):
    permission_classes = [IsAuthenticated]
    correction_fields = {
        "household": {
            "district_missing": (Household, "district"),
            "parish_missing": (Household, "parish"),
            "village_ea_missing": (Household, "village_ea"),
            "region_missing": (Household, "region"),
        },
        "respondent": {
            "age_missing": (Respondent, "age"),
            "sex_not_reported": (Respondent, "sex"),
            "duplicate_name": (Respondent, "name"),
        },
        "interview": {
            "future_start": (Interview, "started_at"),
            "missing_completed_at": (Interview, "completed_at"),
            "date_order": (Interview, "completed_at"),
            "survey_mismatch": (Interview, "survey"),
        },
        "survey": {
            "date_order": (Survey, "end_date"),
        },
    }

    def post(self, request):
        key = str(request.data.get("key", ""))
        value = request.data.get("value")
        issues = ValidationIssuesView().get(request).data["issues"]
        issue = next((item for item in issues if item["key"] == key), None)
        if issue is None:
            return Response({"detail": "This issue is no longer current. Refresh the cleaning queue."}, status=404)

        rule = key.rsplit(":", 1)[-1]
        target = self.correction_fields.get(issue["source_type"], {}).get(rule)
        if not target:
            return Response({"detail": "This issue must be corrected in its source module."}, status=400)
        if value is None or (isinstance(value, str) and not value.strip()):
            return Response({"value": "Enter a correction before saving."}, status=400)

        model, field_name = target
        try:
            record = model.objects.get(pk=issue["source_pk"])
        except model.DoesNotExist:
            return Response({"detail": "The source record no longer exists."}, status=404)

        model_field = model._meta.get_field(field_name)
        try:
            cleaned_value = model_field.to_python(value)
            if isinstance(model_field, DateTimeField) and cleaned_value and timezone.is_naive(cleaned_value):
                cleaned_value = timezone.make_aware(cleaned_value)
            if model_field.is_relation:
                setattr(record, model_field.attname, cleaned_value)
            else:
                setattr(record, field_name, cleaned_value)
            record.full_clean(exclude=[field.name for field in model._meta.fields if field.name != field_name])
        except (ValidationError, ValueError, TypeError) as exc:
            detail = exc.message_dict if hasattr(exc, "message_dict") else getattr(exc, "messages", [str(exc)])
            return Response({"value": detail}, status=400)

        record.save()
        CleaningAction.objects.update_or_create(
            issue_key=key,
            defaults={
                "record_id": issue["id"],
                "field": issue["field"],
                "issue": issue["issue"],
                "severity": issue["severity"],
                "module": issue["module"],
                "status": CleaningAction.Status.REVIEWED,
                "note": f"Corrected {field_name} via Data Cleaning.",
                "updated_by": request.user,
            },
        )
        return Response({"detail": "Correction saved. Run review again to confirm the result."})


class HouseholdViewSet(ModelViewSet):
    serializer_class = HouseholdSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Household.objects.select_related("survey").annotate(
            member_count=Count("respondents", distinct=True)
        )
        survey_id = self.request.query_params.get("survey")
        if survey_id:
            queryset = queryset.filter(survey_id=survey_id)
        return queryset


class RespondentViewSet(ModelViewSet):
    serializer_class = RespondentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Respondent.objects.select_related("household", "household__survey")
        survey_id = self.request.query_params.get("survey")
        household_id = self.request.query_params.get("household")
        if survey_id:
            queryset = queryset.filter(household__survey_id=survey_id)
        if household_id:
            queryset = queryset.filter(household_id=household_id)
        return queryset


class InterviewViewSet(ModelViewSet):
    serializer_class = InterviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Interview.objects.select_related("survey", "household", "questionnaire")
        survey_id = self.request.query_params.get("survey")
        if survey_id:
            queryset = queryset.filter(survey_id=survey_id)
        return queryset

    @action(detail=True, methods=["get", "put"], url_path="session")
    def session(self, request, pk=None):
        interview = self.get_object()
        questionnaire = interview.questionnaire
        if questionnaire is None:
            questionnaire = (
                Questionnaire.objects.filter(survey_id=interview.survey_id, status=Questionnaire.Status.PUBLISHED)
                .prefetch_related("sections__questions__options")
                .first()
            )
            if questionnaire:
                interview.questionnaire = questionnaire
                interview.save(update_fields=["questionnaire", "updated_at"])
        if questionnaire is None:
            return Response({"detail": "This survey does not have a published questionnaire yet."}, status=404)

        sections = list(questionnaire.sections.all())
        questions = [question for section in sections for question in section.questions.all()]
        if request.method == "GET":
            responses = {
                str(response.question_id): response.answer
                for response in interview.responses.filter(question__in=questions)
            }
            return Response(self._session_payload(interview, questionnaire, sections, responses))

        if interview.status == Interview.Status.COMPLETED:
            return Response({"detail": "This interview has already been completed."}, status=400)
        submitted = request.data.get("answers", [])
        complete = request.data.get("complete", False)
        if not isinstance(submitted, list) or not isinstance(complete, bool):
            return Response({"detail": "Answers must be a list and complete must be a boolean."}, status=400)

        question_map = {question.id: question for question in questions}
        normalized_answers = {}
        for item in submitted:
            if not isinstance(item, dict) or "question" not in item or "answer" not in item:
                return Response({"detail": "Each answer needs a question ID and answer value."}, status=400)
            try:
                question_id = int(item["question"])
            except (TypeError, ValueError):
                return Response({"detail": "An answer contains an invalid question ID."}, status=400)
            question = question_map.get(question_id)
            if question is None:
                return Response({"detail": "An answer refers to a question outside this questionnaire."}, status=400)
            if question_id in normalized_answers:
                return Response({"detail": "A question can only be submitted once per save."}, status=400)
            answer = item["answer"]
            validation_error = self._answer_error(question, answer)
            if validation_error:
                return Response({"detail": question.label + ": " + validation_error}, status=400)
            normalized_answers[question_id] = answer

        current_answers = {
            response.question_id: response.answer
            for response in interview.responses.filter(question__in=questions)
        }
        current_answers.update(normalized_answers)
        if complete:
            missing = [
                question.label
                for question in questions
                if question.required and self._is_empty(current_answers.get(question.id))
            ]
            if missing:
                return Response({"detail": "Complete the required questions: " + "; ".join(missing)}, status=400)

        with transaction.atomic():
            for question_id, answer in normalized_answers.items():
                InterviewResponse.objects.update_or_create(
                    interview=interview,
                    question_id=question_id,
                    defaults={"answer": answer},
                )
            if complete:
                interview.status = Interview.Status.COMPLETED
                interview.completed_at = timezone.now()
                interview.save(update_fields=["status", "completed_at", "updated_at"])
            elif interview.status == Interview.Status.NOT_STARTED:
                interview.status = Interview.Status.IN_PROGRESS
                interview.save(update_fields=["status", "updated_at"])

        return Response({"detail": "Interview submitted successfully."} if complete else {"detail": "Progress saved."})

    @staticmethod
    def _is_empty(value):
        return value is None or value == "" or value == []

    @classmethod
    def _answer_error(cls, question, answer):
        if cls._is_empty(answer):
            return None
        question_type = question.question_type
        if question_type in (Question.QuestionType.SHORT_TEXT, Question.QuestionType.LONG_TEXT):
            if not isinstance(answer, str):
                return "Enter text for this question."
            if len(answer) > 10000:
                return "Text answers must be 10,000 characters or fewer."
        elif question_type == Question.QuestionType.NUMBER:
            if isinstance(answer, bool) or not isinstance(answer, (int, float)) or not math.isfinite(answer):
                return "Enter a valid number."
        elif question_type in (Question.QuestionType.SINGLE_CHOICE, Question.QuestionType.DROPDOWN):
            valid_values = set(question.options.values_list("value", flat=True))
            if not isinstance(answer, str) or answer not in valid_values:
                return "Choose one of the listed options."
        elif question_type == Question.QuestionType.MULTIPLE_CHOICE:
            valid_values = set(question.options.values_list("value", flat=True))
            if not isinstance(answer, list) or any(not isinstance(value, str) or value not in valid_values for value in answer):
                return "Choose only from the listed options."
        elif question_type == Question.QuestionType.DATE:
            if not isinstance(answer, str):
                return "Enter a valid date."
            try:
                date.fromisoformat(answer)
            except ValueError:
                return "Enter a valid date."
        elif question_type == Question.QuestionType.YES_NO and not isinstance(answer, bool):
            return "Choose yes or no."
        return None

    @staticmethod
    def _session_payload(interview, questionnaire, sections, responses):
        return {
            "interview": {
                "id": interview.id,
                "status": interview.status,
                "household_id": interview.household.household_id,
                "survey": interview.survey.name,
                "started_at": interview.started_at,
                "completed_at": interview.completed_at,
            },
            "questionnaire": {
                "id": questionnaire.id,
                "title": questionnaire.title,
                "status": questionnaire.status,
                "sections": [
                    {
                        "id": section.id,
                        "title": section.title,
                        "description": section.description,
                        "questions": [
                            {
                                "id": question.id,
                                "label": question.label,
                                "question_type": question.question_type,
                                "required": question.required,
                                "options": [
                                    {"label": option.label, "value": option.value}
                                    for option in question.options.all()
                                ],
                                "answer": responses.get(str(question.id)),
                            }
                            for question in section.questions.all()
                        ],
                    }
                    for section in sections
                ],
            },
        }
