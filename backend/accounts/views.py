from django.contrib.auth import get_user_model
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import UserProfile
from .serializers import (
    AccountSettingsSerializer,
    ChangePasswordSerializer,
    ROLE_NAMES,
    UserAdminSerializer,
    UserRoleField,
)


User = get_user_model()


class UserAdminViewSet(ModelViewSet):
    serializer_class = UserAdminSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        queryset = User.objects.prefetch_related("groups").order_by("username")
        search = self.request.query_params.get("search", "").strip()
        role = self.request.query_params.get("role")
        active = self.request.query_params.get("active")

        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
            )
        if role == "Administrator":
            queryset = queryset.filter(Q(is_staff=True) | Q(is_superuser=True) | Q(groups__name=role))
        elif role in ROLE_NAMES:
            queryset = queryset.filter(groups__name=role, is_staff=False, is_superuser=False)
        elif role == "Field Officer":
            queryset = queryset.filter(is_staff=False, is_superuser=False).exclude(groups__name__in=ROLE_NAMES[:-1])
        if active == "true":
            queryset = queryset.filter(is_active=True)
        elif active == "false":
            queryset = queryset.filter(is_active=False)
        return queryset.distinct()


def account_settings_data(user, profile):
    preferences = dict(UserProfile.DEFAULT_NOTIFICATIONS)
    if isinstance(profile.notification_preferences, dict):
        preferences.update({
            key: value
            for key, value in profile.notification_preferences.items()
            if key in preferences and isinstance(value, bool)
        })
    return {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": user.get_full_name().strip() or user.get_username(),
        "email": user.email,
        "role": UserRoleField().to_representation(user),
        "time_zone": profile.time_zone,
        "notification_preferences": preferences,
    }


class AccountSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _created = UserProfile.objects.get_or_create(user=request.user)
        return Response(account_settings_data(request.user, profile))

    def patch(self, request):
        serializer = AccountSettingsSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        allowed_keys = {"first_name", "last_name", "email", "time_zone", "notification_preferences"}
        unknown_keys = set(request.data.keys()) - allowed_keys
        if unknown_keys:
            return Response({"detail": "Unsupported settings fields: " + ", ".join(sorted(unknown_keys))}, status=status.HTTP_400_BAD_REQUEST)

        if "time_zone" in data:
            try:
                ZoneInfo(data["time_zone"])
            except (ZoneInfoNotFoundError, ValueError):
                return Response({"time_zone": "Choose a valid time zone."}, status=status.HTTP_400_BAD_REQUEST)

        if "notification_preferences" in data:
            preferences = data["notification_preferences"]
            unknown_preferences = set(preferences) - set(UserProfile.DEFAULT_NOTIFICATIONS)
            if unknown_preferences:
                return Response({"notification_preferences": "One or more notification options are not supported."}, status=status.HTTP_400_BAD_REQUEST)

        profile, _created = UserProfile.objects.get_or_create(user=request.user)
        for field in ("first_name", "last_name", "email"):
            if field in data:
                setattr(request.user, field, data[field])
        if any(field in data for field in ("first_name", "last_name", "email")):
            request.user.save(update_fields=[field for field in ("first_name", "last_name", "email") if field in data])
        if "time_zone" in data:
            profile.time_zone = data["time_zone"]
        if "notification_preferences" in data:
            current = dict(UserProfile.DEFAULT_NOTIFICATIONS)
            if isinstance(profile.notification_preferences, dict):
                current.update(profile.notification_preferences)
            current.update(data["notification_preferences"])
            profile.notification_preferences = current
        if "time_zone" in data or "notification_preferences" in data:
            profile.save()
        return Response(account_settings_data(request.user, profile))


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        current_password = serializer.validated_data["current_password"]
        new_password = serializer.validated_data["new_password"]
        if not request.user.check_password(current_password):
            return Response({"current_password": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(new_password, request.user)
        except DjangoValidationError as exc:
            return Response({"new_password": list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save(update_fields=["password"])
        update_session_auth_hash(request._request, request.user)
        return Response({"detail": "Password changed successfully."})
