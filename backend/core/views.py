from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated 
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password



class RegisterView(APIView):
    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        password_confirm = request.data.get('password_confirm')
        
        
        errors = {}
        if not username or not email or not password or not password_confirm:
            errors['detail'] = 'Fill all fields'
        
        if password != password_confirm:
            errors['password_confirm'] = ['Passwords do not match']
        
        if User.objects.filter(username=username).exists():
            errors['username'] = ['Username is already taken']
        
        if User.objects.filter(email=email).exists():
            errors['email'] = ['Email is already registered']
        
        if errors:
            return Response(errors, status=400)
        
        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()
        return Response({'message': 'User created'}, status=201)
    
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
    
class PasswordVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get("password")
        if not password:
            return Response({"verified": False, "error": "No password provided"}, status=400)

        is_correct = check_password(password, request.user.password)
        if is_correct:
            return Response({"verified": True})
        return Response({"verified": False}, status=403)