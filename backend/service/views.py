from rest_framework.views import APIView
from rest_framework.response import Response
# https://www.django-rest-framework.org/api-guide/permissions/
from rest_framework.permissions import IsAuthenticated 

from django.http import FileResponse
from django.shortcuts import get_object_or_404

from core.models import Document, Signature
from core.serializers import DocumentSerializer

#Document related views
class DocumentListCreateView(APIView):
    permission_classes = [IsAuthenticated] 
    
    def get(self, request):
      user_profile = getattr(request.user, "profile", None)
      is_manager = user_profile and user_profile.role == "manager"
 
      if is_manager:
        docs = Document.objects.all()
      else:
        docs = Document.objects.filter(owner=request.user)

      serializer = DocumentSerializer(docs, many=True)
      return Response(serializer.data)
    
    def post(self, request):
        serializer = DocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class DocumentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, status=404)

        user_profile = getattr(request.user, "profile", None)
        is_manager = user_profile and user_profile.role == "manager"
        if not (is_manager or doc.owner == request.user):
            return Response({'error': 'Permission denied'}, status=403)

        serializer = DocumentSerializer(doc)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        user_profile = getattr(request.user, "profile", None)
        is_manager = user_profile and user_profile.role == "manager"
        is_owner = doc.owner == request.user

        if not (is_owner or is_manager):
            return Response({'error': 'Permission denied'}, status=403)

        doc.delete()
        return Response({'message': 'Deleted'})

class DocumentSignView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user_profile = getattr(request.user, "profile", None)
        if not user_profile or user_profile.role != "manager":
            return Response({'error': 'Permission denied!'}, status=403)

        try:
            doc = Document.objects.get(pk=pk)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, status=404)

        if Signature.objects.filter(document=doc, user=request.user).exists():
            return Response({'error': 'You have already signed this document!'}, status=400)

        Signature.objects.create(document=doc, user=request.user)
        return Response({'message': 'Signed successfully!'})

class DocumentDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        document = get_object_or_404(Document, pk=pk)
        return FileResponse(document.file_doc.open(), as_attachment=True, filename=document.file_doc.name)