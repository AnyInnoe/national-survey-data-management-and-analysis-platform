from rest_framework import serializers

from .models import GeneratedReport


class GeneratedReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GeneratedReport
        fields = [
            "id", "title", "report_type", "survey", "survey_name", "summary",
            "data_snapshot", "row_count", "generated_by_name", "generated_at",
        ]
        read_only_fields = fields

    def get_generated_by_name(self, obj):
        if not obj.generated_by:
            return "Unknown"
        return obj.generated_by.get_full_name() or obj.generated_by.get_username()
