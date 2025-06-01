from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("courses/", include("courses.urls")),
    path("admin/", admin.site.urls),
]