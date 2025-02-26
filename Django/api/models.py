import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class UserToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    key = models.CharField(max_length=40, primary_key=True)
    created = models.DateTimeField(auto_now_add=True)
    expires = models.DateTimeField()
    
    def save(self, *args, **kwargs):
        if not self.key:
            self.key = str(uuid.uuid4())[:40]
        if not self.expires:
            self.expires = timezone.now() + timezone.timedelta(hours=24)
        return super().save(*args, **kwargs)
        
    @property
    def is_expired(self):
        return timezone.now() >= self.expires