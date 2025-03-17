from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import UserToken, MyUser
from django.utils import timezone
from django.urls import get_resolver
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import sys

class CustomTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        print("=== AUTHENTICATION DEBUG ===", flush=True)
        print(f"Path: {request.path}", flush=True)
        print(f"Method: {request.method}", flush=True)
        
        # Print all headers to see what's actually being sent
        print("All request headers:", flush=True)
        for key, value in request.META.items():
            if key.startswith('HTTP_'):
                print(f"  {key}: {value[:50] if isinstance(value, str) else value}", flush=True)
        
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        print(f"Auth header: {auth_header[:50] if auth_header else 'None'}", flush=True)
        
        if not auth_header or not auth_header.startswith('Token '):
            print("No valid Authorization header found - returning None", flush=True)
            return None

        # Rest of your authentication code remains the same
        token_key = auth_header.split(' ')[1]
        print(f"Extracted token key: {token_key}", flush=True)
        try:
            token = UserToken.objects.get(key=token_key)
            if token.is_expired:
                print("Token is expired", flush=True)
                token.delete()
                raise AuthenticationFailed('Token đã hết hạn')
            user = MyUser.objects.get(pk=token.user.pk)
            print(f"Authentication success for user: {user.username}", flush=True)
            return (user, token)
        except UserToken.DoesNotExist:
            print("Token not found in database", flush=True)
            raise AuthenticationFailed('Invalid token')