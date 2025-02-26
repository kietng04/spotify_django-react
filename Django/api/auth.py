from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import UserToken, User
from django.utils import timezone

class CustomTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Token '):
            return None
            
        token_key = auth_header.split(' ')[1]
        
        try:
            token = UserToken.objects.get(key=token_key)
            # Kiểm tra token hết hạn
            if token.is_expired:
                # Xóa token hết hạn
                token.delete()
                raise AuthenticationFailed('Token đã hết hạn')
            return (token.user, token)
        except UserToken.DoesNotExist:
            raise AuthenticationFailed('Token không hợp lệ')