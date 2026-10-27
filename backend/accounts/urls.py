from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AccountSettingsView, ChangePasswordView, UserAdminViewSet

router = DefaultRouter()
router.register("users", UserAdminViewSet, basename="user-admin")

urlpatterns = [
    path("account/settings/", AccountSettingsView.as_view(), name="account-settings"),
    path("account/password/", ChangePasswordView.as_view(), name="account-password"),
    path("", include(router.urls)),
]
