from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import User, UserToken
from .serializers import UserSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import status
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.utils import timezone

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Allow anyone to register, but require authentication for other actions.
        """
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        try:
            user = User.objects.get(username=username)
            if check_password(password, user.password):
                UserToken.objects.filter(user=user).delete()
                token = UserToken.objects.create(
                    user=user,
                    expires=timezone.now() + timezone.timedelta(hours=24)
                )
                return Response({
                    'token': token.key,
                    'user_id': user.id,
                    'username': user.username,
                    'role': user.role,
                    'expires': token.expires
                })
            else:
                return Response({"error": "Sai mật khẩu"}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "Tài khoản không tồn tại"}, status=status.HTTP_400_BAD_REQUEST)