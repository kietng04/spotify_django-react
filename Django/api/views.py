from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import MyUser, UserToken, Track, UserLikedTrack, Conversation, Message
from .serializers import UserSerializer, SimpleTrackSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from django.utils import timezone
from .utils.s3_utils import generate_presigned_url
from django.http import Http404, JsonResponse
from .auth import CustomTokenAuthentication 
from rest_framework.decorators import authentication_classes
from rest_framework.decorators import permission_classes
from django.db.models import Q
import sys
import logging
from django.utils.timezone import datetime
from .models import Track, Album, Artist
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
logger = logging.getLogger('django')

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
        track_ids = [track.id for track in tracks]
        context = {'request': request}
        
        if request.user and request.user.is_authenticated:
            liked_track_ids = UserLikedTrack.objects.filter(
                user=request.user, 
                track_id__in=track_ids
            ).values_list('track_id', flat=True)
            context['liked_track_ids'] = liked_track_ids
        serializer = SimpleTrackSerializer(tracks, many=True, context=context)
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
        
class CheckLikeStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_id = request.query_params.get('user_id')
        track_id = request.query_params.get('track_id')
        
        if not user_id or not track_id:
            return Response({'error': 'Both user_id and track_id are required'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = MyUser.objects.get(id=user_id)
            track = Track.objects.get(id=track_id)
            
            is_liked = UserLikedTrack.objects.filter(user=user, track=track).exists()
            
            return Response({
                'is_liked': is_liked
            }, status=status.HTTP_200_OK)
            
        except MyUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Track.DoesNotExist:
            return Response({'error': 'Track not found'}, status=status.HTTP_404_NOT_FOUND)
        
class LikedTracksView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            user = request.user
        else:
            try:
                user = MyUser.objects.get(id=user_id)
            except MyUser.DoesNotExist:
                return Response({'error': 'Ko co user nay'}, status=status.HTTP_404_NOT_FOUND)
        
        liked_tracks = Track.objects.filter(
            id__in=UserLikedTrack.objects.filter(user=user).values_list('track_id', flat=True)
        ).select_related('album').prefetch_related('artists')

        context = {
            'request': request,
            'liked_track_ids': [track.id for track in liked_tracks]
        }
        
        serializer = SimpleTrackSerializer(liked_tracks, many=True, context=context)
        return Response(serializer.data)       

class ConversationListView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    
    def get(self, request):
        user = request.user
        conversations = Conversation.objects.filter(participants=user)
        
        result = []
        for conv in conversations:
            other_user = conv.participants.exclude(id=user.id).first()
            if not other_user:
                continue
                
            last_message = conv.messages.order_by('-timestamp').first()
            if not last_message:
                continue
                
            unread_count = conv.messages.filter(is_read=False).exclude(sender=user).count()
            
            result.append({
                'id': conv.id,
                'username': other_user.username,
                'user_id': other_user.id,
                'lastMessage': last_message.content[:50],
                'timestamp': last_message.timestamp,
                'unread': unread_count
            })
            
        return Response(result)

class MessageListView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    
    def get(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            if request.user not in conversation.participants.all():
                return Response({"error": "Không có quyền truy cập"}, status=403)
                
            messages = conversation.messages.order_by('timestamp')
            
            unread_messages = messages.filter(is_read=False).exclude(sender=request.user)
            for msg in unread_messages:
                msg.is_read = True
                msg.save()
                
            result = []
            for msg in messages:
                result.append({
                    'id': msg.id,
                    'sender': msg.sender.id,
                    'text': msg.content,
                    'timestamp': msg.timestamp.strftime('%H:%M'),
                    'is_read': msg.is_read
                })
                
            return Response(result)
        except Conversation.DoesNotExist:
            return Response({"error": "Không tìm thấy cuộc trò chuyện"}, status=404)
    
    def post(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            
            if request.user not in conversation.participants.all():
                return Response({"error": "Không có quyền truy cập"}, status=403)
            
            content = request.data.get('content')
            if not content or not content.strip():
                return Response({"error": "Nội dung tin nhắn không được trống"}, status=400)
            
            message = Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content=content.strip(),
                is_read=False
            )
            
      
            return Response({
                'id': message.id,
                'sender': message.sender.id,
                'text': message.content,
                'timestamp': message.timestamp.strftime('%H:%M'),
                'is_read': message.is_read
            }, status=201)
            
        except Conversation.DoesNotExist:
            return Response({"error": "Không tìm thấy cuộc trò chuyện"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
class UserSearchView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            query = request.query_params.get('q', '')
            logger.info(f"Query: {query}")
            
            if len(query) < 2:
                logger.info("Query quá ngắn")
                return Response([])
            
            users = MyUser.objects.filter(username__icontains=query).exclude(id=request.user.id)[:10]
            
            logger.info(f"Tìm thấy {len(users)} kết quả")
            
            result = []
            for user in users:
                user_data = {
                    'id': user.id,
                    'username': user.username,
                    'avatarImg': user.avatarImg.url if user.avatarImg and hasattr(user.avatarImg, 'url') else None
                }
                result.append(user_data)
                
            # logger.info ("Kết quả:")
            return Response(result)
            
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
class ConversationCreateView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    
    def post(self, request):
        recipient_id = request.data.get('recipient_id')
        initial_message = request.data.get('initial_message')
        
        if not recipient_id:
            return Response({'error': 'Thiếu thông tin người nhận'}, status=400)
            
        try:
            recipient = MyUser.objects.get(id=recipient_id)
            existing_conversations = Conversation.objects.filter(participants=request.user).filter(participants=recipient)
            
            if existing_conversations.exists():
                conversation = existing_conversations.first()
            else:
                conversation = Conversation.objects.create()
                conversation.participants.add(request.user, recipient)
                conversation.save()
            
            # Create the initial message if provided
            message = None
            if initial_message and initial_message.strip():
                message = Message.objects.create(
                    conversation=conversation,
                    sender=request.user,
                    content=initial_message,
                    is_read=False
                )
                
            return Response({
                'conversation_id': conversation.id,
                'recipient': {
                    'id': recipient.id,
                    'username': recipient.username,
                    'avatarImg': recipient.avatarImg.url if recipient.avatarImg else None
                },
                'message': {
                    'id': message.id,
                    'content': message.content,
                    'sender': message.sender.id,
                    'timestamp': message.timestamp.strftime('%H:%M')
                } if message else None
            })
        except MyUser.DoesNotExist:
            return Response({'error': 'Không tìm thấy người dùng'}, status=404)
        
class ConversationSearchView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        print(f"Getting conversations for user: {user.username} (ID: {user.id})")
        other_user_id = request.query_params.get('user_id')
        if other_user_id:
            # Get conversations between the current user and the specified user
            try:
                other_user = MyUser.objects.get(id=other_user_id)
                conversations = Conversation.objects.filter(participants=user).filter(participants=other_user)
                print(f"Found {conversations.count()} conversations with user ID: {other_user_id}")
            except MyUser.DoesNotExist:
                return Response({'error': 'User not found'}, status=404)
        else:
            # Get all conversations for the current user
            conversations = Conversation.objects.filter(participants=user)
            print(f"Found {conversations.count()} total conversations")
        result = []
        for conv in conversations:
            #traverse conv.participants.all() and get the other user
            other_user = conv.participants.exclude(id=user.id).first()
            #print other_user
            print(f"Conversation {conv.id} with {other_user.username} (ID: {other_user.id})")
            # Get the last message in the conversation
            last_message = conv.messages.order_by('-timestamp').first()
            # push into result
            result.append({
                'conversation_id': conv.id,
                'other_user': {
                    'id': other_user.id,
                    'username': other_user.username,
                    'avatarImg': other_user.avatarImg.url if other_user.avatarImg else None
                },
                'last_message': last_message.content if last_message else None,
                'timestamp': last_message.timestamp if last_message else None
            })
        return Response(result)
    
class AdminUserListView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
            # Kiểm tra nếu người dùng là admin
            if request.user.role != 'admin':
                return Response({"error": "Không có quyền truy cập"}, status=status.HTTP_403_FORBIDDEN)
            
            users = MyUser.objects.all()
            
            result = []
            for user in users:
                user_data = {
                    'id': user.id,
                    'username': user.username,
                    'name': f"{user.first_name} {user.last_name}".strip(),
                    'email': user.email,
                    'image': user.avatarImg.url if user.avatarImg and hasattr(user.avatarImg, 'url') else None,
                    'status': 'Active' if user.is_active else 'Inactive',
                    'createdAt': user.date_joined.strftime('%Y-%m-%d'),
                    'role': user.role,
                    # Thêm số đơn hàng nếu có model liên quan
                    'orders': 0  # Cập nhật nếu có model Order
                }
                result.append(user_data)
                
            return Response(result)
            
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
from rest_framework.permissions import AllowAny

from rest_framework.permissions import AllowAny


from rest_framework.exceptions import AuthenticationFailed
class PublicUserListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
   # Sửa trong class PublicUserListView
    def get(self, request):
        users = MyUser.objects.all()
        
        result = []
        for user in users:
            # Xử lý đường dẫn hình ảnh đúng cách
            avatarImg = user.avatarImg
            if avatarImg:
                if isinstance(avatarImg, str):
                    # Kiểm tra nếu là URL bên ngoài (bắt đầu với http)
                    if avatarImg.startswith(('http://', 'https://')):
                        image_url = avatarImg  # Giữ nguyên URL bên ngoài
                    else:
                        # Nếu là đường dẫn local, thêm domain
                        image_url = request.build_absolute_uri(f'/media/{avatarImg}')
                else:
                    # Nếu là đối tượng ImageField
                    image_url = request.build_absolute_uri(avatarImg.url) if hasattr(avatarImg, 'url') else None
            else:
                image_url = None
                
            user_data = {
                'id': user.id,
                'username': user.username,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'email': user.email,
                'image': image_url,
                'status': 'Active' if user.is_active else 'Inactive',
                'createdAt': user.date_joined.strftime('%Y-%m-%d'),
                'role': user.role,
                'is_superuser': user.is_superuser,  # Thêm dòng này
                'is_staff': user.is_staff,          # Thêm dòng này
            }
            result.append(user_data)
            
        return Response(result)


class BlockUser(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request, user_id):
        try:
            user_id = int(user_id)
            user_to_block = MyUser.objects.get(id=user_id)
            
            # Lấy trạng thái từ request body nếu có
            user_to_block.is_active = False
            user_to_block.save()
            
            return Response({"message": f"Người dùng {user_to_block.username} đã bị chặn"}, status=200)
        except Exception as e:
            import traceback
            print(f"Error: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=500)
        
class Unblock(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request, user_id):
        try:
            user_id = int(user_id)
            user_to_unblock = MyUser.objects.get(id=user_id)
            
            # Lấy trạng thái từ request body nếu có
            user_to_unblock.is_active = True
            user_to_unblock.save()
            
            return Response({"message": f"Người dùng {user_to_unblock.username} đã được mở khóa"}, status=200)
        except Exception as e:
            import traceback
            print(f"Error: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=500)
        
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny      
class CreateUserView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        try:
            # Lấy dữ liệu từ request
            username = request.data.get('username')
            email = request.data.get('email')
            password = request.data.get('password')
            first_name = request.data.get('first_name', '')
            last_name = request.data.get('last_name', '')
            is_superuser = request.data.get('is_superuser', False)
            is_staff = request.data.get('is_staff', False)
            is_active = request.data.get('is_active', True)
            avatarImg = request.data.get('avatarImg', None)
            role = request.data.get('role', 'user')
            
            # Kiểm tra dữ liệu
            if not username or not email or not password:
                return Response({
                    "detail": "Username, email và mật khẩu là bắt buộc"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Tạo người dùng mới
            user = MyUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_superuser=is_superuser,
                is_staff=is_staff,
                is_active=is_active,
                role=role
            )
            
            # Xử lý ảnh đại diện nếu có
            if avatarImg and avatarImg.startswith('data:image'):
                # Tạo thư mục lưu hình nếu chưa tồn tại
                import os
                import base64
                from django.conf import settings
                from django.core.files.base import ContentFile
                
                UPLOAD_DIR = os.path.join(settings.MEDIA_ROOT, 'hinhanh')
                if not os.path.exists(UPLOAD_DIR):
                    os.makedirs(UPLOAD_DIR)
                
                # Xử lý chuỗi Base64
                format, imgstr = avatarImg.split(';base64,')
                ext = format.split('/')[-1]
                filename = f"{username}_{user.id}.{ext}"
                
                # Lưu file vào folder hinhanh
                data = ContentFile(base64.b64decode(imgstr))
                file_path = os.path.join(UPLOAD_DIR, filename)
                
                with open(file_path, 'wb') as f:
                    f.write(data.read())
                
                # Lưu đường dẫn trong database
                user.avatarImg = f"hinhanh/{filename}"
                user.save()
                
            return Response({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "message": "Người dùng đã được tạo thành công"
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            print(f"Error creating user: {str(e)}")
            print(traceback.format_exc())
            return Response({
                "detail": f"Lỗi khi tạo người dùng: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UpdateUserView(APIView):
    """API view để cập nhật thông tin người dùng"""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def put(self, request, user_id):
        try:
            # Tìm người dùng cần cập nhật
            user = MyUser.objects.get(id=user_id)
            
            # Lấy dữ liệu từ request
            username = request.data.get('username')
            email = request.data.get('email')
            password = request.data.get('password', None)
            first_name = request.data.get('first_name', '')
            last_name = request.data.get('last_name', '')
            is_superuser = request.data.get('is_superuser', user.is_superuser)
            is_staff = request.data.get('is_staff', user.is_staff)
            is_active = request.data.get('is_active', user.is_active)
            avatarImg = request.data.get('avatarImg', user.avatarImg)
            role = request.data.get('role', user.role)
            
            # Kiểm tra dữ liệu
            if not username or not email:
                return Response({
                    "detail": "Username và email là bắt buộc"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Kiểm tra username đã tồn tại chưa (nếu thay đổi)
            if username != user.username and MyUser.objects.filter(username=username).exists():
                return Response({
                    "detail": "Tên đăng nhập đã tồn tại"
                }, status=status.HTTP_400_BAD_REQUEST)
                
            # Kiểm tra email đã tồn tại chưa (nếu thay đổi)
            if email != user.email and MyUser.objects.filter(email=email).exists():
                return Response({
                    "detail": "Email đã tồn tại"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Cập nhật thông tin người dùng
            user.username = username
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.is_superuser = is_superuser
            user.is_staff = is_staff
            user.is_active = is_active
            user.role = role
            
            # Cập nhật mật khẩu nếu được cung cấp
            if password:
                user.set_password(password)
            
            # Xử lý ảnh đại diện nếu có thay đổi và là chuỗi base64
            if avatarImg and avatarImg != user.avatarImg and avatarImg.startswith('data:image'):
                # Tạo thư mục lưu hình nếu chưa tồn tại
                import os
                import base64
                from django.conf import settings
                from django.core.files.base import ContentFile
                
                UPLOAD_DIR = os.path.join(settings.MEDIA_ROOT, 'hinhanh')
                if not os.path.exists(UPLOAD_DIR):
                    os.makedirs(UPLOAD_DIR)
                
                # Xử lý chuỗi Base64
                format, imgstr = avatarImg.split(';base64,')
                ext = format.split('/')[-1]
                filename = f"{username}_{user.id}.{ext}"
                
                # Lưu file vào folder hinhanh
                data = ContentFile(base64.b64decode(imgstr))
                file_path = os.path.join(UPLOAD_DIR, filename)
                
                with open(file_path, 'wb') as f:
                    f.write(data.read())
                
                # Lưu đường dẫn trong database
                user.avatarImg = f"hinhanh/{filename}"
            
            # Lưu thay đổi
            user.save()
                
            # Trả về thông tin người dùng đã cập nhật
            return Response({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "role": user.role,
                "message": "Cập nhật người dùng thành công"
            }, status=status.HTTP_200_OK)
            
        except MyUser.DoesNotExist:
            return Response({
                "detail": f"Không tìm thấy người dùng với ID {user_id}"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            print(f"Error updating user: {str(e)}")
            print(traceback.format_exc())
            return Response({
                "detail": f"Lỗi khi cập nhật người dùng: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TrackListView(APIView):
    """
    API view để lấy danh sách tất cả tracks cho trang quản lý
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            tracks = Track.objects.all().select_related('album').prefetch_related('artists')
            
            result = []
            for track in tracks:
                # Lấy tên nghệ sĩ
                artists = track.artists.all()
                artist_names = [artist.name for artist in artists]
                
                track_data = {
                    'id': track.id,
                    'title': track.title,
                    'uri': track.uri,
                    'duration_ms': track.duration_ms,
                    'track_number': track.track_number,
                    'disc_number': track.disc_number,
                    'explicit': track.explicit,
                    'popularity': track.popularity,
                    'spotify_id': track.spotify_id,
                    'preview_url': track.preview_url,
                    'created_at': track.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'updated_at': track.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'album_id': track.album.id,
                    'album_name': track.album.title,
                    'artists': artist_names,
                    'image': track.album.cover_image_url if hasattr(track.album, 'cover_image_url') else None
                }
                result.append(track_data)
                
            return Response(result)
            
        except Exception as e:
            import traceback
            print(f"Error fetching tracks: {str(e)}")
            print(traceback.format_exc())
            return Response({
                "detail": f"Lỗi khi lấy danh sách tracks: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class AddTrackView(APIView):
    """
    API view để thêm bài hát mới
    """
    permission_classes = [AllowAny]  # Có thể thay đổi thành IsAuthenticated nếu cần xác thực
    
    def post(self, request):
        try:
            title = request.data.get('title')
            album_id = request.data.get('album')
            audio_file = request.FILES.get('audio_file')
            duration_ms = request.data.get('duration_ms')
            track_number = request.data.get('track_number', 1)
            disc_number = request.data.get('disc_number', 1)
            explicit = request.data.get('explicit', False)
            popularity = request.data.get('popularity', 50)
            
            # Kiểm tra dữ liệu đầu vào
            if not title or not album_id or not audio_file:
                return Response({
                    "detail": "Tên bài hát, album và file MP3 là bắt buộc"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Tìm album
            try:
                album = Album.objects.get(id=album_id)
            except Album.DoesNotExist:
                return Response({
                    "detail": f"Không tìm thấy album với ID {album_id}"
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Lưu file MP3
            import os
            from django.conf import settings
            
            # Tạo thư mục lưu file nếu chưa tồn tại
            UPLOAD_DIR = os.path.join(settings.MEDIA_ROOT, 'mp3')
            if not os.path.exists(UPLOAD_DIR):
                os.makedirs(UPLOAD_DIR)
            
            # Tạo tên file an toàn
            safe_title = "".join([c if c.isalnum() else "-" for c in title])
            filename = f"{safe_title}-{int(datetime.now().timestamp())}.mp3"
            file_path = os.path.join(UPLOAD_DIR, filename)
            
            # Lưu file
            with open(file_path, 'wb+') as destination:
                for chunk in audio_file.chunks():
                    destination.write(chunk)
            
            # Tạo bài hát mới
            track = Track.objects.create(
                title=title,
                album=album,
                uri=f"mp3/{filename}",
                duration_ms=duration_ms,
                track_number=track_number,
                disc_number=disc_number,
                explicit=explicit,
                popularity=popularity
            )
            
            # Thêm nghệ sĩ (mặc định là ID 1)
            artist_ids = request.data.getlist('artists') or [1]
            for artist_id in artist_ids:
                try:
                    artist = Artist.objects.get(id=artist_id)
                    track.artists.add(artist)
                except Artist.DoesNotExist:
                    # Bỏ qua nếu không tìm thấy nghệ sĩ
                    pass
            
            return Response({
                "id": track.id,
                "title": track.title,
                "album": track.album.title,
                "uri": track.uri,
                "message": "Bài hát đã được thêm thành công"
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            print(f"Error adding track: {str(e)}")
            print(traceback.format_exc())
            return Response({
                "detail": f"Lỗi khi thêm bài hát: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)