from django.conf import settings
from django.db import models

from surveys.models import Survey


class GeneratedReport(models.Model):
    class ReportType(models.TextChoices):
        OVERVIEW = "overview", "Survey Overview"
        DEMOGRAPHICS = "demographics", "Respondent Demographics"
        HOUSEHOLDS = "households", "Household Distribution"
        INTERVIEWS = "interviews", "Interview Progress"
        RESPONSES = "responses", "Questionnaire Responses"

    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=30, choices=ReportType.choices)
    survey = models.ForeignKey(
        Survey,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="generated_reports",
    )
    survey_name = models.CharField(max_length=200)
    data_snapshot = models.JSONField(default=list)
    summary = models.JSONField(default=dict)
    row_count = models.PositiveIntegerField(default=0)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="generated_survey_reports",
    )
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return self.title
