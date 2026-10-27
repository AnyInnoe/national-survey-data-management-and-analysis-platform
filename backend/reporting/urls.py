from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import GenerateReportView, GeneratedReportViewSet

router = DefaultRouter()
router.register("reports", GeneratedReportViewSet, basename="generated-report")

urlpatterns = [
    path("reports/generate/", GenerateReportView.as_view(), name="generate-report"),
    path("", include(router.urls)),
]
