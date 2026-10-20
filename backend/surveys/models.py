from django.db import models


class Survey(models.Model):
    class SurveyType(models.TextChoices):
        HOUSEHOLD = "household", "Household"
        ICT = "ict", "ICT"
        AGRICULTURE = "agriculture", "Agriculture"
        EDUCATION = "education", "Education"
        HEALTH = "health", "Health"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    name = models.CharField(max_length=200)
    survey_type = models.CharField(
        max_length=20,
        choices=SurveyType.choices,
        default=SurveyType.HOUSEHOLD,
    )
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name