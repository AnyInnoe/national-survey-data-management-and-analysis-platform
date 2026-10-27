from django.contrib import admin

from .models import CleaningAction, Household, Interview, Respondent


@admin.register(Household)
class HouseholdAdmin(admin.ModelAdmin):
    list_display = ("household_id", "survey", "district", "parish", "village_ea", "region", "created_at")
    list_filter = ("survey", "region", "district")
    search_fields = ("household_id", "district", "parish", "village_ea")


@admin.register(Respondent)
class RespondentAdmin(admin.ModelAdmin):
    list_display = ("person_id", "name", "household", "sex", "age", "relationship")
    list_filter = ("sex",)
    search_fields = ("person_id", "name", "household__household_id")


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ("id", "survey", "household", "status", "started_at", "completed_at")
    list_filter = ("status", "survey")
    search_fields = ("household__household_id", "household__district")


@admin.register(CleaningAction)
class CleaningActionAdmin(admin.ModelAdmin):
    list_display = ("record_id", "field", "status", "severity", "updated_by", "updated_at")
    list_filter = ("status", "severity", "module")
    search_fields = ("issue_key", "record_id", "field", "issue", "note")
