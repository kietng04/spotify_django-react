from rest_framework import serializers
from .models import MyUser
from django.contrib.auth.hashers import make_password 

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyUser
        fields = ['id', 'username', 'password', 'email', 'first_name', 'last_name', 'avatarImg', 'role']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        """Create and return a new user"""
        user = MyUser.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],  
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        user.avatarImg = validated_data.get('avatarImg', None)
        user.role = validated_data.get('role', 'user')
        user.save()
        
        return user
        
    def update(self, instance, validated_data):
        """Update and return an existing user"""
        instance.username = validated_data.get('username', instance.username)
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.avatarImg = validated_data.get('avatarImg', instance.avatarImg)
        instance.role = validated_data.get('role', instance.role)
    
        if 'password' in validated_data:
            instance.set_password(validated_data['password'])  
        
        instance.save()
        return instance