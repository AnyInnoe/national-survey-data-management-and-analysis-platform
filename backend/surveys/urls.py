from rest_framework.routers import DefaultRouter

from data_collection.views import HouseholdViewSet, InterviewViewSet, RespondentViewSet
from .views import (
    QuestionOptionViewSet,
    QuestionViewSet,
    QuestionnaireSectionViewSet,
    QuestionnaireViewSet,
    SurveyViewSet,
)

router = DefaultRouter()
router.register("surveys", SurveyViewSet, basename="survey")
router.register("questionnaires", QuestionnaireViewSet, basename="questionnaire")
router.register(
    "questionnaire-sections",
    QuestionnaireSectionViewSet,
    basename="questionnaire-section",
)
router.register("questions", QuestionViewSet, basename="question")
router.register("question-options", QuestionOptionViewSet, basename="question-option")
router.register("households", HouseholdViewSet, basename="household")
router.register("respondents", RespondentViewSet, basename="respondent")
router.register("interviews", InterviewViewSet, basename="interview")

urlpatterns = router.urls
