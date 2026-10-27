from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers


User = get_user_model()
ROLE_CHOICES = (
    ("Administrator", "Administrator"),
    ("Supervisor", "Supervisor"),
    ("Data Analyst", "Data Analyst"),
    ("Field Officer", "Field Officer"),
)
ROLE_NAMES = [name for name, _label in ROLE_CHOICES]


class UserAdminSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role = serializers.ChoiceField(choices=ROLE_CHOICES, required=False)
    password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "role",
            "password",
            "is_active",
            "is_staff",
            "is_superuser",
            "last_login",
            "date_joined",
        ]
        read_only_fields = ["id", "full_name", "is_staff", "is_superuser", "last_login", "date_joined"]

    def get_full_name(self, user):
        return user.get_full_name().strip() or user.get_username()

    def get_role(self, user):
        if user.is_staff or user.is_superuser:
            return "Administrator"
        assigned_roles = set(user.groups.filter(name__in=ROLE_NAMES).values_list("name", flat=True))
        return next((role for role in ROLE_NAMES if role in assigned_roles), "Field Officer")

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "user", None)
        instance = self.instance
        role = attrs.get("role", self.get_role(instance) if instance else "Field Officer")

        if not instance and not attrs.get("password"):
            raise serializers.ValidationError({"password": "A temporary password is required."})
        if attrs.get("password"):
            candidate = User(
                username=attrs.get("username", getattr(instance, "username", "")),
                email=attrs.get("email", getattr(instance, "email", "")),
                first_name=attrs.get("first_name", getattr(instance, "first_name", "")),
                last_name=attrs.get("last_name", getattr(instance, "last_name", "")),
            )
            try:
                password_validation.validate_password(attrs["password"], candidate)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({"password": list(exc.messages)}) from exc

        if role == "Administrator" and not getattr(actor, "is_superuser", False):
            raise serializers.ValidationError({"role": "Only a superuser can grant administrator access."})
        if instance and instance.is_superuser and role != "Administrator":
            raise serializers.ValidationError({"role": "A superuser cannot be demoted here."})
        if instance and instance.is_staff and role != "Administrator" and not getattr(actor, "is_superuser", False):
            raise serializers.ValidationError({"role": "Only a superuser can change a staff administrator's role."})
        if instance and actor and instance.pk == actor.pk and attrs.get("is_active") is False:
            raise serializers.ValidationError({"is_active": "You cannot deactivate your own account."})
        return attrs

    def _set_role(self, user, role, actor):
        role_group, _created = Group.objects.get_or_create(name=role)
        user.groups.remove(*Group.objects.filter(name__in=ROLE_NAMES))
        user.groups.add(role_group)
        if role == "Administrator":
            user.is_staff = True
        elif not user.is_superuser and getattr(actor, "is_superuser", False):
            user.is_staff = False
        user.save(update_fields=["is_staff"])

    def create(self, validated_data):
        password = validated_data.pop("password")
        role = validated_data.pop("role", "Field Officer")
        user = User.objects.create_user(password=password, **validated_data)
        self._set_role(user, role, self.context["request"].user)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        role = validated_data.pop("role", self.get_role(instance))
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        self._set_role(instance, role, self.context["request"].user)
        return instance
