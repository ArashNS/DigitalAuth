from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    # https://docs.djangoproject.com/en/5.2/ref/models/fields/#django.db.models.Field.choices
    ROLE_CHOICES = (
        ('client', 'Client'),
        ('manager', 'Manager')
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class Document(models.Model):
    # https://docs.djangoproject.com/en/5.2/ref/models/fields/#django.db.models.ForeignKey
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=50)
    department = models.CharField(max_length=50, default="General")
    file_doc = models.FileField(upload_to='docs/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.uploaded_at.date()})"


class Signature(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="signatures")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="signatures")
    signed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} signed {self.document.title} at {self.signed_at}"