import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser

class MyUser(AbstractUser):
    avatarImg = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('user', 'User'),
    )
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='user')
    
    def __str__(self):
        return self.username

class UserToken(models.Model):
    user = models.ForeignKey('MyUser', on_delete=models.CASCADE)
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