from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import UserToken, MyUser
from django.utils import timezone

class CustomTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Token '):
            return None

        token_key = auth_header.split(' ')[1]

        try:
            token = UserToken.objects.get(key=token_key)
            if token.is_expired:
                token.delete()
                raise AuthenticationFailed('Token đã hết hạn')
            user = MyUser.objects.get(pk=token.user.pk)
            return (user, token)
        except UserToken.DoesNotExist:
            raise AuthenticationFailed('Token không hợp lệ')