from rest_framework import serializers
from .models import (
    MyUser, Artist, Genre, Album, Track, Playlist, 
    PlaylistTrack, UserLikedTrack, TrackPlay, Message, Conversation
)
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

class ArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = ['id', 'name', 'bio', 'image_url', 'spotify_id', 'followers', 'popularity']

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name']

class SimpleTrackSerializer(serializers.ModelSerializer):
    artists = ArtistSerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    class Meta:
        model = Track
        fields = ['id', 'title', 'artists', 'duration_ms', 'uri', 'popularity', 'is_liked']

    def get_is_liked(self, obj):
        liked_track_ids = self.context.get('liked_track_ids', [])
        return obj.id in liked_track_ids

class AlbumSerializer(serializers.ModelSerializer):
    artists = ArtistSerializer(many=True, read_only=True)
    genres = GenreSerializer(many=True, read_only=True)
    
    class Meta:
        model = Album
        fields = [
            'id', 'title', 'artists', 'cover_image_url', 'release_date', 
            'album_type', 'total_tracks', 'popularity', 'genres'
        ]

class TrackSerializer(serializers.ModelSerializer):
    artists = ArtistSerializer(many=True, read_only=True)
    album = AlbumSerializer(read_only=True)
    genres = GenreSerializer(many=True, read_only=True)
    
    class Meta:
        model = Track
        fields = [
            'id', 'title', 'artists', 'album', 'uri', 'duration_ms', 
            'track_number', 'disc_number', 'explicit', 'popularity',
            'spotify_id', 'preview_url', 'genres'
        ]

class PlaylistSerializer(serializers.ModelSerializer):
    creator_username = serializers.ReadOnlyField(source='creator.username')
    tracks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Playlist
        fields = [
            'id', 'name', 'description', 'cover_image_url', 'creator', 
            'creator_username', 'is_public', 'followers_count', 
            'tracks_count', 'created_at'
        ]
        
    def get_tracks_count(self, obj):
        return obj.tracks.count()

class PlaylistDetailSerializer(PlaylistSerializer):
    tracks = serializers.SerializerMethodField()
    
    class Meta(PlaylistSerializer.Meta):
        fields = PlaylistSerializer.Meta.fields + ['tracks']
        
    def get_tracks(self, obj):
        playlist_tracks = PlaylistTrack.objects.filter(playlist=obj).order_by('position')
        return [
            {
                'position': pt.position,
                'added_at': pt.added_at,
                'added_by': pt.added_by.username if pt.added_by else None,
                'track': SimpleTrackSerializer(pt.track).data
            }
            for pt in playlist_tracks
        ]

class UserLikedTrackSerializer(serializers.ModelSerializer):
    track = SimpleTrackSerializer(read_only=True)
    
    class Meta:
        model = UserLikedTrack
        fields = ['id', 'user', 'track', 'added_at']

class TrackPlaySerializer(serializers.ModelSerializer):
    track = SimpleTrackSerializer(read_only=True)
    
    class Meta:
        model = TrackPlay
        fields = ['id', 'user', 'track', 'played_at', 'duration_played_ms']

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'timestamp', 'is_read']
        
class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'created_at', 'updated_at', 'participants', 'last_message', 'other_user']
        
    def get_last_message(self, obj):
        message = obj.messages.order_by('-timestamp').first()
        if message:
            return MessageSerializer(message).data
        return None
            
    def get_other_user(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            other_user = obj.participants.exclude(id=request.user.id).first()
            if other_user:
                return UserSerializer(other_user).data
        return None
