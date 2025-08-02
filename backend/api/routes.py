from django.urls import path
from core.views import  RegisterView, CustomTokenObtainPairView,  PasswordVerifyView
from service.views import DocumentListCreateView, DocumentDetailView, DocumentSignView, DocumentDownloadView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    #jwt , signup , signin
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-password/', PasswordVerifyView.as_view(), name='verify-password'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    #docs
    path('documents/', DocumentListCreateView.as_view(), name='documents'),
    path('documents/<int:pk>/', DocumentDetailView.as_view(), name='document-detail'), 
    path('documents/<int:pk>/sign/', DocumentSignView.as_view(), name='document-sign'),
    path('documents/<int:pk>/download/', DocumentDownloadView.as_view(), name='document-download'),
]
