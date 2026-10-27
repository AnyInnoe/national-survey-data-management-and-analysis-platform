from django.core.validators import MaxValueValidator, MinValueValidator
from django.conf import settings
from django.db import models
from django.utils import timezone

from surveys.models import Question, Questionnaire, Survey


class Household(models.Model):
    survey = models.ForeignKey(
        Survey,
        on_delete=models.CASCADE,
        related_name="households",
    )
    household_id = models.CharField(max_length=20, unique=True, blank=True, editable=False)
    district = models.CharField(max_length=100)
    parish = models.CharField(max_length=100)
    village_ea = models.CharField(max_length=150)
    region = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        creating_code = not self.household_id
        super().save(*args, **kwargs)
        if creating_code:
            self.household_id = f"HH-{self.pk:07d}"
            super().save(update_fields=["household_id", "updated_at"])

    def __str__(self):
        return self.household_id or f"Household {self.pk}"


class Respondent(models.Model):
    class Sex(models.TextChoices):
        FEMALE = "female", "Female"
        MALE = "male", "Male"
        OTHER = "other", "Other"
        NOT_REPORTED = "not_reported", "Not reported"

    household = models.ForeignKey(
        Household,
        on_delete=models.CASCADE,
        related_name="respondents",
    )
    person_id = models.CharField(max_length=20, unique=True, blank=True, editable=False)
    name = models.CharField(max_length=200)
    sex = models.CharField(max_length=20, choices=Sex.choices, default=Sex.NOT_REPORTED)
    age = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(120)],
    )
    relationship = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at", "id"]

    def save(self, *args, **kwargs):
        creating_code = not self.person_id
        super().save(*args, **kwargs)
        if creating_code:
            self.person_id = f"P-{self.pk:07d}"
            super().save(update_fields=["person_id", "updated_at"])

    def __str__(self):
        return f"{self.person_id or 'Respondent'} · {self.name}"


class Interview(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not started"
        IN_PROGRESS = "in_progress", "In progress"
        COMPLETED = "completed", "Completed"

    survey = models.ForeignKey(
        Survey,
        on_delete=models.CASCADE,
        related_name="interviews",
    )
    questionnaire = models.ForeignKey(
        Questionnaire,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="interviews",
    )
    household = models.ForeignKey(
        Household,
        on_delete=models.CASCADE,
        related_name="interviews",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
    )
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return f"Interview {self.pk} · {self.household.household_id}"


class InterviewResponse(models.Model):
    interview = models.ForeignKey(
        Interview,
        on_delete=models.CASCADE,
        related_name="responses",
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.PROTECT,
        related_name="interview_responses",
    )
    answer = models.JSONField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["question__section__order", "question__order", "question_id"]
        constraints = [
            models.UniqueConstraint(fields=["interview", "question"], name="unique_interview_question_response"),
        ]

    def __str__(self):
        return f"{self.interview_id} · {self.question_id}"


class CleaningAction(models.Model):
    class Status(models.TextChoices):
        REVIEWED = "reviewed", "Reviewed"
        DISMISSED = "dismissed", "Dismissed"

    issue_key = models.CharField(max_length=250, unique=True)
    record_id = models.CharField(max_length=100)
    field = models.CharField(max_length=100)
    issue = models.TextField()
    severity = models.CharField(max_length=20)
    module = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status.choices)
    note = models.TextField(blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="cleaning_actions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.status}: {self.record_id} · {self.field}"
