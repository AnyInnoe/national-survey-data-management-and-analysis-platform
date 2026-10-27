from django.contrib import admin

from .models import GeneratedReport


@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = ("title", "report_type", "survey_name", "row_count", "generated_by", "generated_at")
    list_filter = ("report_type", "generated_at")
    search_fields = ("title", "survey_name", "generated_by__username")
