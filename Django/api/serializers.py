from rest_framework import serializers
from .models import (
    MyUser, Artist, Genre, Album, Track, Playlist, 
    PlaylistTrack, UserLikedTrack, TrackPlay, Message, Conversation,
    PremiumPayment 
)
from django.contrib.auth.hashers import make_password 
from .utils.s3_utils import generate_presigned_url
import logging # Import logging

logger = logging.getLogger(__name__) # Get logger instance

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = MyUser
        fields = ['id', 'username', 'password', 'email', 'first_name', 'last_name', 'avatarImg', 'role', 'is_superuser']
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
    track_cover_url = serializers.SerializerMethodField()
    class Meta:
        model = Track
        fields = ['id', 'title', 'artists', 'duration_ms', 'popularity', 'is_liked', 'is_premium', 'track_cover_url']

    def get_is_liked(self, obj):
        liked_track_ids = self.context.get('liked_track_ids', [])
        return obj.id in liked_track_ids

    def get_track_cover_url(self, obj):
        logger.debug(f"Track ID {obj.id}: Checking cover_image field.") # DEBUG
        s3_key = obj.cover_image
        
        if s3_key:
            logger.debug(f"Track ID {obj.id}: Found cover_image key: {s3_key}") # DEBUG
            try:
                logger.debug(f"Track ID {obj.id}: Attempting generate_presigned_url for key: {s3_key}") # DEBUG
                presigned_url = generate_presigned_url(s3_key=s3_key, expiration=3600)
                logger.debug(f"Track ID {obj.id}: generate_presigned_url returned: {presigned_url}") # DEBUG
                
                if presigned_url:
                    logger.debug(f"Track ID {obj.id}: Returning presigned URL: {presigned_url}") # DEBUG
                    return presigned_url
                else:
                    logger.warning(f"Track ID {obj.id}: generate_presigned_url returned None for key: {s3_key}") # WARNING
                    # Fall through if generate_presigned_url returns None

            except Exception as e:
                logger.error(f"Track ID {obj.id}: Error generating presigned URL for track cover {s3_key}: {e}", exc_info=True) # ERROR with traceback
                # Fall through to return album cover or None
                pass
        else:
             logger.debug(f"Track ID {obj.id}: cover_image field is empty or None.") # DEBUG
        
        # Fallback 1: Try to return the album's cover URL
        logger.debug(f"Track ID {obj.id}: Falling back to album cover.") # DEBUG
        if hasattr(obj, 'album') and obj.album and obj.album.cover_image_url:
             album_url = obj.album.cover_image_url
             logger.debug(f"Track ID {obj.id}: Returning album cover URL: {album_url}") # DEBUG
             return album_url

        # Fallback 2: Return None if neither exists
        logger.debug(f"Track ID {obj.id}: No track or album cover found. Returning None.") # DEBUG
        return None

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
            'id', 'title', 'artists', 'album', 'duration_ms', 
            'track_number', 'disc_number', 'explicit', 'popularity',
            'spotify_id', 'preview_url', 'genres', 'is_premium',
            'audio_file', 'cover_image'
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

class PremiumPaymentSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username') 
    purchase_date = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = PremiumPayment
        fields = ['id', 'order_id', 'user', 'purchase_date']
