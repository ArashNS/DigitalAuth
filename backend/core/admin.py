from django.contrib import admin
from service.models import Document,UserProfile, Signature

admin.site.register(Document)
admin.site.register(UserProfile)
admin.site.register(Signature)

