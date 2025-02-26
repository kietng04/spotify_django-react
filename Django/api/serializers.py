from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password 

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'avatarImg', 'role']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        """Create and return a new user"""
        validated_data['password'] = make_password(validated_data['password'])
        
        user = User.objects.create(
            username=validated_data['username'],
            password=validated_data['password'],  
            avatarImg=validated_data.get('avatarImg', None),
            role=validated_data.get('role', 0)
        )
        
        return user
        
    def update(self, instance, validated_data):
        """Update and return an existing user"""
        instance.username = validated_data.get('username', instance.username)
        instance.avatarImg = validated_data.get('avatarImg', instance.avatarImg)
        instance.role = validated_data.get('role', instance.role)
    
        if 'password' in validated_data:
            instance.password = make_password(validated_data['password'])
            
        instance.save()
        return instance