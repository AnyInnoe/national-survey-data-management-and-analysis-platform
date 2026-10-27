from rest_framework import serializers

from surveys.models import Survey

from .models import Household, Interview, Respondent


class HouseholdSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()

    class Meta:
        model = Household
        fields = [
            "id",
            "household_id",
            "survey",
            "district",
            "parish",
            "village_ea",
            "region",
            "members",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "household_id", "members", "created_at", "updated_at"]

    def get_members(self, obj):
        if hasattr(obj, "member_count"):
            return obj.member_count
        return obj.respondents.count()


class RespondentSerializer(serializers.ModelSerializer):
    household_id = serializers.CharField(source="household.household_id", read_only=True)
    district = serializers.CharField(source="household.district", read_only=True)
    survey = serializers.IntegerField(source="household.survey_id", read_only=True)

    class Meta:
        model = Respondent
        fields = [
            "id",
            "person_id",
            "household",
            "household_id",
            "survey",
            "name",
            "sex",
            "age",
            "relationship",
            "district",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "person_id", "household_id", "survey", "district", "created_at", "updated_at"]


class InterviewSerializer(serializers.ModelSerializer):
    household_id = serializers.CharField(source="household.household_id", read_only=True)

    class Meta:
        model = Interview
        fields = [
            "id",
            "survey",
            "household",
            "household_id",
            "status",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "household_id", "created_at", "updated_at"]

    def validate(self, attrs):
        household = attrs.get("household", getattr(self.instance, "household", None))
        survey = attrs.get("survey", getattr(self.instance, "survey", None))
        if household and survey and household.survey_id != survey.id:
            raise serializers.ValidationError({"household": "The household must belong to the selected survey."})
        return attrs
