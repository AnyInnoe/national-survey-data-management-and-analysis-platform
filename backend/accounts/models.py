from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    DEFAULT_NOTIFICATIONS = {
        "emailAlerts": True,
        "validationAlerts": True,
        "weeklySummary": False,
    }

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    time_zone = models.CharField(max_length=64, default="Africa/Kampala")
    notification_preferences = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Settings for {self.user.get_username()}"
