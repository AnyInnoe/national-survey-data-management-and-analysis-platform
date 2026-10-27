from django.db import transaction
from rest_framework import serializers

from .models import (
    Question,
    Questionnaire,
    QuestionnaireSection,
    QuestionOption,
    Survey,
)


class SurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = [
            "id",
            "name",
            "survey_type",
            "description",
            "start_date",
            "end_date",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ["id", "question", "label", "value", "order"]
        read_only_fields = ["id"]


class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "section", "label", "question_type", "required", "order", "options"]
        read_only_fields = ["id", "options"]


class QuestionnaireSectionSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = QuestionnaireSection
        fields = ["id", "questionnaire", "title", "description", "order", "questions"]
        read_only_fields = ["id", "questions"]


class NestedQuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ["id", "label", "value", "order"]
        read_only_fields = ["id"]


class NestedQuestionSerializer(serializers.ModelSerializer):
    options = NestedQuestionOptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ["id", "label", "question_type", "required", "order", "options"]
        read_only_fields = ["id"]


class NestedQuestionnaireSectionSerializer(serializers.ModelSerializer):
    questions = NestedQuestionSerializer(many=True, required=False)

    class Meta:
        model = QuestionnaireSection
        fields = ["id", "title", "description", "order", "questions"]
        read_only_fields = ["id"]


class QuestionnaireSerializer(serializers.ModelSerializer):
    sections = NestedQuestionnaireSectionSerializer(many=True, required=False)

    class Meta:
        model = Questionnaire
        fields = [
            "id",
            "survey",
            "title",
            "description",
            "status",
            "created_at",
            "updated_at",
            "sections",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def _create_sections(self, questionnaire, sections_data):
        for section_data in sections_data:
            questions_data = section_data.pop("questions", [])
            section = QuestionnaireSection.objects.create(
                questionnaire=questionnaire,
                **section_data,
            )

            for question_data in questions_data:
                options_data = question_data.pop("options", [])
                question = Question.objects.create(
                    section=section,
                    **question_data,
                )
                QuestionOption.objects.bulk_create([
                    QuestionOption(question=question, **option_data)
                    for option_data in options_data
                ])

    @transaction.atomic
    def create(self, validated_data):
        sections_data = validated_data.pop("sections", [])
        questionnaire = Questionnaire.objects.create(**validated_data)
        self._create_sections(questionnaire, sections_data)
        return questionnaire

    @transaction.atomic
    def update(self, instance, validated_data):
        sections_data = validated_data.pop("sections", None)

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        if sections_data is not None:
            instance.sections.all().delete()
            self._create_sections(instance, sections_data)

        return instance