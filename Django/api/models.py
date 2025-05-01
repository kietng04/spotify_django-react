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

class Artist(models.Model):
    name = models.CharField(max_length=255)
    bio = models.TextField(blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    spotify_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    followers = models.IntegerField(default=0)
    popularity = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Album(models.Model):
    ALBUM_TYPE_CHOICES = (
        ('album', 'Album'),
        ('single', 'Single'),
        ('ep', 'EP'),
        ('compilation', 'Compilation'),
    )
    
    title = models.CharField(max_length=255)
    artists = models.ManyToManyField(Artist, related_name='albums')
    cover_image_url = models.URLField(blank=True, null=True)
    release_date = models.DateField()
    spotify_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    album_type = models.CharField(max_length=20, choices=ALBUM_TYPE_CHOICES, default='album')
    total_tracks = models.IntegerField(default=0)
    popularity = models.IntegerField(default=0)
    genres = models.ManyToManyField(Genre, related_name='albums', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title

class Track(models.Model):
    title = models.CharField(max_length=255)
    artists = models.ManyToManyField(Artist, related_name='tracks')
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='tracks')
    audio_file = models.CharField(max_length=1024, help_text="S3 key cho file nhạc MP3/MP4")
    cover_image = models.CharField(max_length=1024, blank=True, null=True, help_text="S3 key cho ảnh bìa (JPG, PNG)")
    duration_ms = models.IntegerField()
    track_number = models.IntegerField()
    disc_number = models.IntegerField(default=1)
    explicit = models.BooleanField(default=False)
    popularity = models.IntegerField(default=0)
    spotify_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    preview_url = models.URLField(blank=True, null=True)
    genres = models.ManyToManyField(Genre, related_name='tracks', blank=True)
    is_premium = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    

class UserData(models.Model):
    user = models.OneToOneField(MyUser, on_delete=models.CASCADE, related_name='user_data')
    # Các trường bổ sung nếu cần (không trùng với MyUser)
    last_login_ip = models.CharField(max_length=45, blank=True, null=True)
    last_activity = models.DateTimeField(blank=True, null=True)
    preferred_language = models.CharField(max_length=10, default='en')
    theme_preference = models.CharField(max_length=20, default='light')
    
    # Số liệu thống kê người dùng
    total_play_count = models.IntegerField(default=0)
    total_listening_time_ms = models.BigIntegerField(default=0)
    most_played_genre = models.ForeignKey(Genre, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"UserData for {self.user.username}"
    
    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}".strip() or self.user.username
    

class Playlist(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    cover_image_url = models.URLField(blank=True, null=True)
    creator = models.ForeignKey(MyUser, on_delete=models.CASCADE, related_name='playlists')
    tracks = models.ManyToManyField(Track, through='PlaylistTrack', related_name='playlists')
    is_public = models.BooleanField(default=True)
    followers_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class PlaylistTrack(models.Model):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(MyUser, on_delete=models.SET_NULL, null=True)
    position = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['position']
        unique_together = ['playlist', 'track']

class UserLikedTrack(models.Model):
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE, related_name='liked_tracks')
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='liked_by')
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'track']

class UserFollowedPlaylist(models.Model):
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE, related_name='followed_playlists')
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name='followers')
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'playlist']

class UserFollowedArtist(models.Model):
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE, related_name='followed_artists')
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='follower_users')
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'artist']

class TrackPlay(models.Model):
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE, related_name='play_history')
    track = models.ForeignKey(Track, on_delete=models.CASCADE, related_name='play_history')
    played_at = models.DateTimeField(auto_now_add=True)
    duration_played_ms = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.user.username} played {self.track.title}"
    
class Conversation(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    participants = models.ManyToManyField(MyUser, related_name='conversations')

    def __str__(self):
        return f"Conversation {self.id}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(MyUser, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Message from {self.sender.username} at {self.timestamp}"

class PremiumPayment(models.Model):
    order_id = models.CharField(max_length=255, unique=True, help_text="Unique ID from the payment provider")
    user = models.ForeignKey(MyUser, on_delete=models.CASCADE, related_name='premium_payments')
    purchase_date = models.DateTimeField(auto_now_add=True, verbose_name="Ngày mua")

    def __str__(self):
        return f"Payment Record #{self.id} (Order: {self.order_id}) for {self.user.username}"

    class Meta:
        ordering = ['-purchase_date']
        verbose_name = "Premium Payment"
        verbose_name_plural = "Premium Payments"
    
