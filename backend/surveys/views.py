from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from .models import (
    Question,
    Questionnaire,
    QuestionnaireSection,
    QuestionOption,
    Survey,
)
from .serializers import (
    QuestionOptionSerializer,
    QuestionnaireSerializer,
    QuestionnaireSectionSerializer,
    QuestionSerializer,
    SurveySerializer,
)


class SurveyViewSet(ModelViewSet):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]


class QuestionnaireViewSet(ModelViewSet):
    queryset = Questionnaire.objects.select_related("survey").prefetch_related(
        "sections__questions__options"
    )
    serializer_class = QuestionnaireSerializer
    permission_classes = [IsAuthenticated]


class QuestionnaireSectionViewSet(ModelViewSet):
    queryset = QuestionnaireSection.objects.select_related("questionnaire")
    serializer_class = QuestionnaireSectionSerializer
    permission_classes = [IsAuthenticated]


class QuestionViewSet(ModelViewSet):
    queryset = Question.objects.select_related("section").prefetch_related("options")
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]


class QuestionOptionViewSet(ModelViewSet):
    queryset = QuestionOption.objects.select_related("question")
    serializer_class = QuestionOptionSerializer
    permission_classes = [IsAuthenticated]