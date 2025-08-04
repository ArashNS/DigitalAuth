from rest_framework import serializers
from service.models import Document, Signature

class SignatureSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Signature
        fields = ['id', 'user', 'signed_at']


class DocumentSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)
    signatures = SignatureSerializer(many=True, read_only=True)
    file_size = serializers.SerializerMethodField()
    is_signed = serializers.SerializerMethodField()
    signed_by = serializers.SerializerMethodField()
    signed_at = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id',
            'title',
            'department',
            'owner',
            'uploaded_at',
            'file_doc',
            'file_size',
            'is_signed',
            'signed_by',
            'signed_at',
            'signatures',
        ]

    def get_file_size(self, obj):
        try:
            size = obj.file_doc.size
            return f"{size / 1024:.2f} KB"
        except:
            return None

    def get_is_signed(self, obj):
        return obj.signatures.exists()

    def get_signed_by(self, obj):
        if obj.signatures.exists():
            return obj.signatures.last().user.username
        return None

    def get_signed_at(self, obj):
        if obj.signatures.exists():
            return obj.signatures.last().signed_at
        return None
