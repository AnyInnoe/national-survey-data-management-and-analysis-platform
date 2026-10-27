"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from data_collection.views import DataCleaningCorrectionView, DataCleaningView, ValidationIssuesView

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include("surveys.urls")),
    path("api/", include("reporting.urls")),
    path("api/", include("accounts.urls")),
    path("api/validation/issues/", ValidationIssuesView.as_view(), name="validation-issues"),
    path("api/cleaning/issues/", DataCleaningView.as_view(), name="cleaning-issues"),
    path("api/cleaning/correct/", DataCleaningCorrectionView.as_view(), name="cleaning-correct"),
]
