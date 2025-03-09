from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import MyUser, UserToken, Track, UserLikedTrack
from .serializers import UserSerializer, SimpleTrackSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.utils import timezone
from .utils.s3_utils import generate_presigned_url
from django.http import Http404, JsonResponse
from .auth import CustomTokenAuthentication 

class TokenValidationView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'valid': True,
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'avatarImg': user.avatarImg.url if user.avatarImg else None
        })
    
class UserViewSet(viewsets.ModelViewSet):
    queryset = MyUser.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)
        
        if user:
            UserToken.objects.filter(user=user).delete()
            token = UserToken.objects.create(
                user=user,
                expires=timezone.now() + timezone.timedelta(hours=24)
            )
            return Response({
                'token': token.key,
                'user_id': user.id,
                'username': user.username,
                'expires': token.expires
            })
        else:
            return Response({"error": "Thông tin đăng nhập không chính xác"}, status=status.HTTP_400_BAD_REQUEST)

class LoginWithGoogleView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        username = request.data.get('email')
        Img = request.data.get('photoURL')
        name = request.data.get('displayName', '')
        
        try:
            user = MyUser.objects.get(email=email)
            
            if Img and Img != user.avatarImg:
                user.avatarImg = Img
                user.save()
                
        except MyUser.DoesNotExist:
            name_parts = name.split(' ', 1)
            first_name = name_parts[0] if name_parts else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            import uuid
            random_password = str(uuid.uuid4())
            
            user = MyUser.objects.create_user(
                username=username,
                email=email,
                password=random_password,
                first_name=first_name,
                last_name=last_name
            )
            
            if Img:
                user.avatarImg = Img
                user.save()
        
        UserToken.objects.filter(user=user).delete()
        token = UserToken.objects.create(
            user=user,
            expires=timezone.now() + timezone.timedelta(hours=24)
        )
        
        return Response({
            'token': token.key,
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'avatarImg': user.avatarImg.url if user.avatarImg else None,
            'expires': token.expires
        })

class RandomTracksView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        tracks = Track.objects.select_related('album').prefetch_related('artists').order_by('?')[:6]
        serializer = SimpleTrackSerializer(tracks, many=True)
        return Response(serializer.data)
    
class StreamAudioView(APIView):
    permission_classes = [AllowAny]  
    
    def get(self, request, track_id):
        try:
            track = Track.objects.get(id=track_id)

            s3_key = track.uri
            

            if '://' in s3_key:
                s3_key = s3_key.split('://', 1)[1]
                if '/' in s3_key:
                    s3_key = s3_key.split('/', 1)[1]

            presigned_url = generate_presigned_url(
                s3_key=s3_key,
                expiration=3600
            )
            
            if not presigned_url:
                return Response({"error": "Could not generate streaming URL"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            return Response({
                "stream_url": presigned_url,
                "track_details": {
                    "id": track.id,
                    "title": track.title,
                    "artist": ", ".join([artist.name for artist in track.artists.all()]),
                    "album": track.album.title,
                    "duration_ms": track.duration_ms,
                    "cover_image": track.album.cover_image_url if hasattr(track.album, 'cover_image_url') else None
                }
            })
            
        except Track.DoesNotExist:
            return Response({"error": "Track not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(f"Error in StreamAudioView: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class TrackSearchView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        query = request.query_params.get('q', '')
        
        if not query:
            return Response({"error": "Search query is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.db.models import Q
        tracks = Track.objects.filter(
            Q(title__icontains=query) |  
            Q(artists__name__icontains=query)  
        ).select_related('album').prefetch_related('artists').distinct()[:5]
        
        serializer = SimpleTrackSerializer(tracks, many=True)
        return Response(serializer.data)

class LikeTrackView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user_id = request.data.get('user_id')
        track_id = request.data.get('track_id')
        
        if not user_id or not track_id:
            return Response({'error': 'Chưa điền đủ thông tin'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = MyUser.objects.get(id=user_id)
            track = Track.objects.get(id=track_id)
            
            like_records = UserLikedTrack.objects.filter(user=user, track=track)
            
            if like_records.exists():
                like_records.delete()
                return Response({
                    'status': 'success',
                    'action': 'unlike',
                    'message': f"User {user.username} đã xóa yêu thích {track.title}"
                }, status=status.HTTP_200_OK)
            else:
                like = UserLikedTrack.objects.create(user=user, track=track)
                
                return Response({
                    'status': 'success',
                    'action': 'like',
                    'message': f"User {user.username} đã thích {track.title}",
                    'like_id': like.id
                }, status=status.HTTP_201_CREATED)
            
        except MyUser.DoesNotExist:
            return Response({'error': 'Ko tim thay user'}, status=status.HTTP_404_NOT_FOUND)
        except Track.DoesNotExist:
            return Response({'error': 'Ko tim thay nhac'}, status=status.HTTP_404_NOT_FOUND)