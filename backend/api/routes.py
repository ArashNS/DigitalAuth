from django.urls import path
from core.views import DocumentListCreateView, DocumentSignView, DocumentDetailView, RegisterView, CustomTokenObtainPairView, DocumentDownloadView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('documents/', DocumentListCreateView.as_view()),
    path('documents/<int:pk>/', DocumentDetailView.as_view()), 
    path('documents/<int:pk>/sign/', DocumentSignView.as_view()),
    path('documents/<int:pk>/download/', DocumentDownloadView.as_view()),
]
