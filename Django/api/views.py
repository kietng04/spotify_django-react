from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import MyUser, UserToken, Track, UserLikedTrack, Conversation, Message, Playlist, PlaylistTrack, UserFollowedPlaylist
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
from time import time
from datetime import datetime
import json, hmac, hashlib, urllib.request, urllib.parse, random
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth.hashers import make_password
from google import genai
import os
import base64
from django.conf import settings
from django.core.files.base import ContentFile
import os
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import uuid
import os
import json
import hmac

GEMINI_API_KEY = "AIzaSyCDBht1ZEgJStn-ycfpFGdWr599E6XC5WA"
client = genai.Client(api_key=GEMINI_API_KEY)

response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Explain how AI works",
)

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
 
class ConversationsSearchView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        conversations = Conversation.objects.filter(participants=user)
        result = []
        
        try:
            gemini_user = MyUser.objects.get(id=1)
            gemini_conversation = Conversation.objects.filter(
                participants=user
            ).filter(
                participants=gemini_user
            ).first()
            
            if not gemini_conversation:
                gemini_conversation = Conversation.objects.create()
                gemini_conversation.participants.add(user, gemini_user)
            
            last_message = Message.objects.filter(conversation=gemini_conversation).order_by('-timestamp').first()
            
            result.append({
                'conversation_id': gemini_conversation.id,
                'timestamp': last_message.timestamp if last_message else gemini_conversation.created_at,
                'last_message': last_message.content if last_message else "Xin chào! Tôi có thể giúp gì cho bạn?",
                'other_user': {
                    'id': gemini_user.id,
                    'username': gemini_user.username,
                    'avatarImg': gemini_user.avatarImg.url if gemini_user.avatarImg else None
                }
            })
            
        except MyUser.DoesNotExist:
            gemini_user = MyUser.objects.create(
                id=1,
                username="Gemini AI",
                email="gemini@example.com",
                password=make_password("geminiAI@2023"),
                is_active=True
            )
            gemini_conversation = Conversation.objects.create()
            gemini_conversation.participants.add(user, gemini_user)
            
            result.append({
                'conversation_id': gemini_conversation.id,
                'timestamp': gemini_conversation.created_at,
                'last_message': "Xin chào! Tôi có thể giúp gì cho bạn?",
                'other_user': {
                    'id': gemini_user.id,
                    'username': gemini_user.username,
                    'avatarImg': None
                }
            })
        
        for conversation in conversations:
            participants = conversation.participants.all()
            other_users = [p for p in participants if p.id != user.id and p.id != 1]
            if not other_users and participants.filter(id=1).exists():
                continue
                
            for other_user in other_users:
                last_message = Message.objects.filter(conversation=conversation).order_by('-timestamp').first()
                
                result.append({
                    'conversation_id': conversation.id,
                    'timestamp': last_message.timestamp if last_message else conversation.created_at,
                    'last_message': last_message.content if last_message else '',
                    'other_user': {
                        'id': other_user.id,
                        'username': other_user.username,
                        'avatarImg': other_user.avatarImg.url if other_user.avatarImg else None
                    }
                })
        
        return Response(result)
    
class ZaloPayView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get list of supported banks from ZaloPay"""
        try:
            config = {
                "app_id": 2553,  # Đã cập nhật
                "key1": "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",  # Đã cập nhật
                "key2": "eG4r0GcoNtRGbO8",  # Đã cập nhật
                "endpoint": "https://sbgateway.zalopay.vn/api/getlistmerchantbanks"
            }
            
            reqtime = str(int(round(time() * 1000)))
            data_str = f"{config['app_id']}|{reqtime}"

            mac = hmac.new(
                config['key1'].encode(), 
                data_str.encode(), 
                hashlib.sha256
            ).hexdigest()

            request_data = {
                "appid": config["app_id"],
                "reqtime": reqtime,
                "mac": mac
            }

            response = urllib.request.urlopen(
                url=config["endpoint"], 
                data=urllib.parse.urlencode(request_data).encode()
            )
            
            result = json.loads(response.read())
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def post(self, request):
        try:
            config = {
                "app_id": 2553,
                "key1": "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
                "key2": "eG4r0GcoNtRGbO8",
                "endpoint": "https://sb-openapi.zalopay.vn/v2/create"
            }
            
            amount = request.data.get('amount', 50000)
            bank_code = request.data.get('bank_code', '')
            payment_method = request.data.get('payment_method', '')  
            username = request.user.username

            current_time = int(round(time() * 1000))
            app_trans_id = "{:%y%m%d}_{}".format(datetime.today(), current_time)
            
            embed_data = {
                "redirecturl": "http://localhost:3000/payment-success"
            }
            
            if payment_method == 'vietqr':
                embed_data["preferred_payment_method"] = ["vietqr"]
                bank_code = ""  # Để trống cho VietQR
            elif payment_method == 'zalopay':
                embed_data["preferred_payment_method"] = ["zalopay_wallet"]
                bank_code = ""
            elif payment_method == 'credit_card':
                embed_data["preferred_payment_method"] = ["international_card"]
                bank_code = ""
            elif payment_method == 'atm':
                if bank_code:
                    # Nếu có mã ngân hàng cụ thể (VCB, ACB, v.v...), giữ nguyên mã và để preferred_method trống
                    embed_data["preferred_payment_method"] = []
                else:
                    # Nếu không có mã ngân hàng cụ thể, hiển thị tất cả ATM
                    embed_data["preferred_payment_method"] = ["domestic_card", "account"]
                    bank_code = ""
            else:
                embed_data["preferred_payment_method"] = []
                bank_code = ""
            
            print(f"Payment method: {payment_method}")
            print(f"Bank code: '{bank_code}'")
            print(f"Embed data before JSON: {embed_data}")
            
            # Chuẩn bị order
            order = {
                "app_id": config["app_id"],
                "app_user": username,
                "app_time": current_time,
                "amount": amount,
                "app_trans_id": app_trans_id,
                "bank_code": bank_code,
                "embed_data": json.dumps(embed_data),
                "item": "[]",
                "description": f"Spotify Premium - Thanh toán cho đơn hàng #{app_trans_id}"
            }
            
     
            print(f"Order sent to ZaloPay: {order}")
  
            data = "{}|{}|{}|{}|{}|{}|{}".format(
                order["app_id"], 
                order["app_trans_id"], 
                order["app_user"], 
                order["amount"], 
                order["app_time"], 
                order["embed_data"], 
                order["item"]
            )
            
            order["mac"] = hmac.new(config['key1'].encode(), data.encode(), hashlib.sha256).hexdigest()

            response = urllib.request.urlopen(
                url=config["endpoint"], 
                data=urllib.parse.urlencode(order).encode()
            )
            
            result = json.loads(response.read())
            print(f"ZaloPay response: {result}")
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"ZaloPay error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class VerifyPaymentView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [AllowAny]
    
    # Add this method to handle ZaloPay redirects
    @method_decorator(csrf_exempt)
    def get(self, request):
        """Handle ZaloPay redirect callback"""
        # Get payment data from query parameters
        payment_data = request.GET.dict()
        app_trans_id = payment_data.get('apptransid')
        status = payment_data.get('status')
        
        # Verify checksum
        config = {"key2": "eG4r0GcoNtRGbO8"}
        
        checksum_data = "{}|{}|{}|{}|{}|{}|{}".format(
            payment_data.get('appid', ''), 
            payment_data.get('apptransid', ''), 
            payment_data.get('pmcid', ''), 
            payment_data.get('bankcode', ''), 
            payment_data.get('amount', ''), 
            payment_data.get('discountamount', ''), 
            payment_data.get('status', '')
        )
        
        checksum = hmac.new(
            config['key2'].encode(), 
            checksum_data.encode(), 
            hashlib.sha256
        ).hexdigest()
        
        # Build frontend redirect URL with all payment parameters
        frontend_url = "http://localhost:3000/payment-process"
        query_params = "&".join([f"{key}={value}" for key, value in payment_data.items()])
        
        # If checksum is valid, include a validation parameter
        if checksum == payment_data.get('checksum'):
            query_params += "&backend_verified=true"
        else:
            query_params += "&backend_verified=false"
            
        redirect_url = f"{frontend_url}?{query_params}"
        
        # Redirect to frontend
        return redirect(redirect_url)
    
    def post(self, request):
        # Existing post method remains the same
        # Get the payment data sent from frontend
        payment_data = request.data
        app_trans_id = payment_data.get('apptransid')
        status = payment_data.get('status')
        
        # Verify checksum
        config = {"key2": "uUfsWgfLkRLzq6W2uNXTCxrfxs51auny"}
        
        checksum_data = "{}|{}|{}|{}|{}|{}|{}".format(
            payment_data.get('appid'), 
            payment_data.get('apptransid'), 
            payment_data.get('pmcid'), 
            payment_data.get('bankcode'), 
            payment_data.get('amount'), 
            payment_data.get('discountamount'), 
            payment_data.get('status')
        )
        
        checksum = hmac.new(
            config['key2'].encode(), 
            checksum_data.encode(), 
            hashlib.sha256
        ).hexdigest()
        
        if checksum != payment_data.get('checksum'):
            return Response({"error": "Invalid checksum"}, status=status.HTTP_400_BAD_REQUEST)
        
        if status == '1':  # payment successful
            # Update user to premium status
            user = request.user
            user.role = 'premium'
            user.save()
            
            return Response({
                "success": True,
                "message": "Payment verified and user upgraded to premium",
                "transaction_id": app_trans_id
            })
        else:
            return Response({
                "success": False,
                "message": "Payment failed",
                "status": status
            }, status=status.HTTP_400_BAD_REQUEST)
        
class UserProfileView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role, 
            'avatarImg': user.avatarImg.url if user.avatarImg and hasattr(user.avatarImg, 'url') else None,
            'created_at': user.date_joined
        })
    
class GeminiAIView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get conversation with Gemini AI"""
        try:
            user = request.user
            try:
                gemini_user = MyUser.objects.get(id=1)
            except MyUser.DoesNotExist:
                gemini_user = MyUser.objects.create(
                    id=1,
                    username="Gemini AI",
                    email="gemini@example.com",
                    password=make_password("geminiAI@2023"),  
                    is_active=True
                )
            
            conversation = Conversation.objects.filter(
                participants=user
            ).filter(
                participants=gemini_user
            ).first()
            
            if not conversation:
                conversation = Conversation.objects.create()
                conversation.participants.add(user, gemini_user)
                
                Message.objects.create(
                    conversation=conversation,
                    sender=gemini_user,
                    content="Xin chào! Tôi là Gemini AI, trợ lý ảo của bạn. Tôi có thể giúp gì cho bạn?",
                    is_read=False
                )
            
            messages = conversation.messages.order_by('timestamp')
            
            result = []
            for msg in messages:
                result.append({
                    'id': msg.id,
                    'sender': msg.sender.id,
                    'text': msg.content,
                    'timestamp': msg.timestamp.strftime('%H:%M'),
                    'is_read': msg.is_read
                })
            
            return Response({
                'conversation_id': conversation.id,
                'messages': result
            })
            
        except Exception as e:
            logger.error(f"Error in GeminiAIView.get: {str(e)}")
            return Response({"error": str(e)}, status=500)
    
    def post(self, request):
        """Send message to Gemini AI with actual Gemini model response"""
        try:
            user = request.user
            message_text = request.data.get('message')
            
            if not message_text or not message_text.strip():
                return Response({"error": "Nội dung tin nhắn không được trống"}, status=400)
            
            # Get or create Gemini AI user
            try:
                gemini_user = MyUser.objects.get(id=1)
            except MyUser.DoesNotExist:
                gemini_user = MyUser.objects.create(
                    id=1,
                    username="Gemini AI",
                    email="gemini@example.com",
                    password=make_password("geminiAI@2023"),
                    is_active=True
                )
            
            # Get or create conversation
            conversation = Conversation.objects.filter(
                participants=user
            ).filter(
                participants=gemini_user
            ).first()
            
            if not conversation:
                conversation = Conversation.objects.create()
                conversation.participants.add(user, gemini_user)

            # Save user message
            user_message = Message.objects.create(
                conversation=conversation,
                sender=user,
                content=message_text.strip(),
                is_read=True  
            )
            
            # Get last few messages for context (max 5)
            recent_messages = conversation.messages.order_by('-timestamp')[:5][::-1]
            conversation_history = []
            
            for msg in recent_messages:
                role = "user" if msg.sender == user else "model"
                conversation_history.append(f"{role}: {msg.content}")
            
            # Prepare context with conversation history
            prompt = "\n".join(conversation_history)
            if not prompt:
                prompt = message_text.strip()
                
            try:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",  # Using a more stable model
                    contents=f"{message_text}\n\nVui lòng trả lời bằng tiếng Việt."
                )
                
                ai_response = response.text
                if not ai_response or ai_response.strip() == "":
                    ai_response = "Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này. Vui lòng thử lại sau."
                    
            except Exception as api_error:
                logger.error(f"Gemini API error: {str(api_error)}")
                ai_response = "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau."
            
            # Save AI response
            ai_message = Message.objects.create(
                conversation=conversation,
                sender=gemini_user,
                content=ai_response,
                is_read=False
            )
            
            return Response({
                'conversation_id': conversation.id,
                'user_message': {
                    'id': user_message.id,
                    'sender': user_message.sender.id,
                    'text': user_message.content,
                    'timestamp': user_message.timestamp.strftime('%H:%M'),
                    'is_read': user_message.is_read
                },
                'ai_message': {
                    'id': ai_message.id,
                    'sender': ai_message.sender.id,
                    'text': ai_message.content,
                    'timestamp': ai_message.timestamp.strftime('%H:%M'),
                    'is_read': ai_message.is_read
                }
            })
        except Exception as e:
           logger.error(f"Error in GeminiAIView.post: {str(e)}")
           return Response({"error": str(e)}, status=500)
        

class AdminUserListView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try:
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
    
    def get(self, request):
        users = MyUser.objects.all()
        
        result = []
        for user in users:
            avatarImg = user.avatarImg
            if avatarImg:
                if isinstance(avatarImg, str):
                    if avatarImg.startswith(('http://', 'https://')):
                        image_url = avatarImg  # Giữ nguyên URL bên ngoài
                    else:
                        image_url = request.build_absolute_uri(f'/media/{avatarImg}')
                else:
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
            
            if not username or not email or not password:
                return Response({
                    "detail": "Username, email và mật khẩu là bắt buộc"
                }, status=status.HTTP_400_BAD_REQUEST)
            
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
            
            if avatarImg and avatarImg.startswith('data:image'):
                # Tạo thư mục lưu hình nếu chưa tồn tại
                
                UPLOAD_DIR = os.path.join(settings.MEDIA_ROOT, 'hinhanh')
                if not os.path.exists(UPLOAD_DIR):
                    os.makedirs(UPLOAD_DIR)
                
                format, imgstr = avatarImg.split(';base64,')
                ext = format.split('/')[-1]
                filename = f"{username}_{user.id}.{ext}"
                
                data = ContentFile(base64.b64decode(imgstr))
                file_path = os.path.join(UPLOAD_DIR, filename)
                
                with open(file_path, 'wb') as f:
                    f.write(data.read())
                
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
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def put(self, request, user_id):
        try:
            user = MyUser.objects.get(id=user_id)
            
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
            if not username or not email:
                return Response({
                    "detail": "Username và email là bắt buộc"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if username != user.username and MyUser.objects.filter(username=username).exists():
                return Response({
                    "detail": "Tên đăng nhập đã tồn tại"
                }, status=status.HTTP_400_BAD_REQUEST)
                
            if email != user.email and MyUser.objects.filter(email=email).exists():
                return Response({
                    "detail": "Email đã tồn tại"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.username = username
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.is_superuser = is_superuser
            user.is_staff = is_staff
            user.is_active = is_active
            user.role = role
            
            if password:
                user.set_password(password)
            
            if avatarImg and avatarImg != user.avatarImg and avatarImg.startswith('data:image'):
            
                
                UPLOAD_DIR = os.path.join(settings.MEDIA_ROOT, 'hinhanh')
                if not os.path.exists(UPLOAD_DIR):
                    os.makedirs(UPLOAD_DIR)
                
                format, imgstr = avatarImg.split(';base64,')
                ext = format.split('/')[-1]
                filename = f"{username}_{user.id}.{ext}"
                
                data = ContentFile(base64.b64decode(imgstr))
                file_path = os.path.join(UPLOAD_DIR, filename)
                
                with open(file_path, 'wb') as f:
                    f.write(data.read())
                
                user.avatarImg = f"hinhanh/{filename}"
            
            user.save()
                
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
   
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            tracks = Track.objects.all().select_related('album').prefetch_related('artists')
            
            result = []
            for track in tracks:
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
    """
    permission_classes = [AllowAny]  
    
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
            
            if not title or not album_id or not audio_file:
                return Response({
                    "detail": "Tên bài hát, album và file MP3 là bắt buộc"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                album = Album.objects.get(id=album_id)
            except Album.DoesNotExist:
                return Response({
                    "detail": f"Không tìm thấy album với ID {album_id}"
                }, status=status.HTTP_404_NOT_FOUND)
            
            
            
            UPLOAD_DIR = os.path.join(settings.MEDIA_ROOT, 'mp3')
            if not os.path.exists(UPLOAD_DIR):
                os.makedirs(UPLOAD_DIR)
            
            safe_title = "".join([c if c.isalnum() else "-" for c in title])
            filename = f"{safe_title}-{int(datetime.now().timestamp())}.mp3"
            file_path = os.path.join(UPLOAD_DIR, filename)
            
            with open(file_path, 'wb+') as destination:
                for chunk in audio_file.chunks():
                    destination.write(chunk)
            
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
        





class PlaylistView(APIView):
    authentication_classes = [CustomTokenAuthentication] 
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        name = request.data.get('name', 'New Playlist')
        description = request.data.get('description', '')
        track_ids = request.data.getlist('tracks', [])
        
        playlist = Playlist.objects.create(
            name=name,
            description=description,
            creator=request.user,
            is_public=True
        )
        
        if 'cover_image' in request.FILES:
            cover_image = request.FILES['cover_image']
            file_name = f"playlist_covers/{str(uuid.uuid4())}{cover_image.name}"
            file_path = default_storage.save(file_name, cover_image)
            playlist.cover_image_url = default_storage.url(file_path)
            playlist.save()
        
        for i, track_id in enumerate(track_ids):
            try:
                track = Track.objects.get(id=track_id)
                PlaylistTrack.objects.create(
                    playlist=playlist,
                    track=track,
                    position=i,
                    added_by=request.user
                )
            except Track.DoesNotExist:
                continue
        UserFollowedPlaylist.objects.create(
            user=request.user,
            playlist=playlist
        )
        
        playlist.followers_count = 1
        playlist.save()
        return Response({
            'id': playlist.id,
            'name': playlist.name,
            'description': playlist.description,
            'cover_image_url': playlist.cover_image_url,
            'track_count': playlist.tracks.count(),
            'created_at': playlist.created_at
        }, status=status.HTTP_201_CREATED)
    
    def get(self, request):
        user = request.user
        playlists = Playlist.objects.filter(creator=user)
        
        playlist_data = []
        for playlist in playlists:
            playlist_data.append({
                'id': playlist.id,
                'name': playlist.name,
                'description': playlist.description,
                'cover_image_url': playlist.cover_image_url,
                'track_count': playlist.tracks.count(),
                'created_at': playlist.created_at
            })
        
        return Response(playlist_data)

class PlaylistFollowView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        playlist_id = request.data.get('playlist_id')
        if not playlist_id:
            return Response({'error': 'Thiếu ID playlist'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = request.user
            playlist = Playlist.objects.get(id=playlist_id)
            follow_record = UserFollowedPlaylist.objects.filter(user=user, playlist=playlist)
            if follow_record.exists():
                follow_record.delete()
                playlist.followers_count = max(0, playlist.followers_count - 1)
                playlist.save()
                return Response({
                    'status': 'success',
                    'action': 'unfollow',
                    'message': f"Đã bỏ theo dõi playlist '{playlist.name}'"
                }, status=status.HTTP_200_OK)
            else:
                UserFollowedPlaylist.objects.create(user=user, playlist=playlist)
                playlist.followers_count += 1
                playlist.save()
                return Response({
                    'status': 'success',
                    'action': 'follow',
                    'message': f"Đã theo dõi playlist '{playlist.name}'"
                }, status=status.HTTP_201_CREATED)
                
        except Playlist.DoesNotExist:
            return Response({'error': 'Không tìm thấy playlist'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    def get(self, request):
        playlist_id = request.query_params.get('playlist_id')
        
        if not playlist_id:
            return Response({'error': 'Thiếu ID playlist'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = request.user
            is_following = UserFollowedPlaylist.objects.filter(
                user=user, 
                playlist_id=playlist_id
            ).exists()
            
            return Response({
                'is_following': is_following
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FollowedPlaylistsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            followed_playlists = Playlist.objects.filter(
                id__in=UserFollowedPlaylist.objects.filter(user=user).values_list('playlist_id', flat=True)
            )
            
            result = []
            for playlist in followed_playlists:
                result.append({
                    'id': playlist.id,
                    'name': playlist.name,
                    'description': playlist.description,
                    'cover_image_url': playlist.cover_image_url,
                    'track_count': playlist.tracks.count(),
                    'creator': {
                        'id': playlist.creator.id,
                        'username': playlist.creator.username
                    },
                    'followers_count': playlist.followers_count,
                    'created_at': playlist.created_at
                })
                
            return Response(result)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class PlaylistDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, playlist_id):
        try:
            user_playlists = Playlist.objects.filter(
                Q(creator=request.user) | 
                Q(id__in=UserFollowedPlaylist.objects.filter(user=request.user).values_list('playlist_id', flat=True))
            )
            playlist = user_playlists.get(id=playlist_id)
            playlist_tracks = PlaylistTrack.objects.filter(playlist=playlist).order_by('position')
            result = {
                'id': playlist.id,
                'name': playlist.name,
                'description': playlist.description,
                'cover_image_url': playlist.cover_image_url,
                'creator': playlist.creator.id,
                'creator_username': playlist.creator.username,
                'is_public': playlist.is_public,
                'followers_count': playlist.followers_count,
                'created_at': playlist.created_at,
                'tracks': []
            }
            for pt in playlist_tracks:
                artists = [{'id': a.id, 'name': a.name} for a in pt.track.artists.all()]
                album = None
                if pt.track.album:
                    album = {
                        'id': pt.track.album.id,
                        'title': pt.track.album.title,
                        'cover_image_url': pt.track.album.cover_image_url
                    }
                result['tracks'].append({
                    'position': pt.position,
                    'added_at': pt.added_at,
                    'added_by': pt.added_by.username if pt.added_by else None,
                    'track': {
                        'id': pt.track.id,
                        'title': pt.track.title,
                        'duration_ms': pt.track.duration_ms,
                        'artists': [{'id': artist.id, 'name': artist.name} for artist in pt.track.artists.all()],
                        'album': {
                            'id': pt.track.album.id if pt.track.album else None,
                            'title': pt.track.album.title if pt.track.album else "Unknown Album",
                            'cover_image_url': pt.track.album.cover_image_url if pt.track.album else None
                        }
                    }
                })
            return Response(result)
        except Playlist.DoesNotExist:
            return Response({'error': 'Playlist not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, playlist_id):
        try:
            playlist = Playlist.objects.get(id=playlist_id, creator=request.user)
            if 'name' in request.data:
                playlist.name = request.data['name']
            if 'description' in request.data:
                playlist.description = request.data['description']
            
            if 'cover_image' in request.FILES:
                cover_image = request.FILES['cover_image']
                file_name = f"playlist_covers/{str(uuid.uuid4())}{cover_image.name}"
                file_path = default_storage.save(file_name, cover_image)
                playlist.cover_image_url = default_storage.url(file_path)
            # toi muon save lại j nah
            playlist.save() 
            
            result = {
                'id': playlist.id,
                'name': playlist.name,
                'description': playlist.description,
                'cover_image_url': playlist.cover_image_url,
                'creator': playlist.creator.id,
                'creator_username': playlist.creator.username,
                'is_public': playlist.is_public,
                'followers_count': playlist.followers_count,
                'created_at': playlist.created_at,
            }
            
            return Response(result)
        
        except Playlist.DoesNotExist:
            return Response({'error': 'Playlist not found or you don\'t have permission to edit it'}, 
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def post(self, request, playlist_id):
        try:
            playlist = Playlist.objects.get(id=playlist_id, creator=request.user)
            track_id = request.data.get('track_id')
            position = request.data.get('position', 0)
            if not track_id:
                return Response({'error': 'Track ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                track = Track.objects.get(id=track_id)
                if PlaylistTrack.objects.filter(playlist=playlist, track=track).exists():
                    return Response({'error': 'Track already exists in this playlist'}, 
                                    status=status.HTTP_400_BAD_REQUEST)
                
                # Add track to playlist
                PlaylistTrack.objects.create(
                    playlist=playlist,
                    track=track,
                    position=position,
                    added_by=request.user
                )
                return Response({'success': True, 'message': 'track dã được thêm vào playlist thành công'},)
            except Track.DoesNotExist:
                return Response({'error': 'Track not found'}, status=status.HTTP_404_NOT_FOUND)
                
        except Playlist.DoesNotExist:
            return Response({'error': 'ko tìm thấy playlist hoặc bạn không có quyền chỉnh sửa nó'}, 
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, playlist_id):
        try:
            playlist = Playlist.objects.get(id=playlist_id, creator=request.user)
            track_id = request.data.get('track_id')
            if not track_id:
                return Response({'error': 'tarck id yêu cau'}, status=status.HTTP_400_BAD_REQUEST)
                
            try:
                playlist_track = PlaylistTrack.objects.get(playlist=playlist, track_id=track_id)
                playlist_track.delete()
                remaining_tracks = PlaylistTrack.objects.filter(playlist=playlist).order_by('position')
                for i, pt in enumerate(remaining_tracks):
                    pt.position = i
                    pt.save()
                return Response({'success': True, 'message': 'track đã dcc xoa'})
            except PlaylistTrack.DoesNotExist:
                return Response({'error': 'ko '}, status=status.HTTP_404_NOT_FOUND)
        except Playlist.DoesNotExist:
            return Response({'error': 'chua tìm thấy playlist hoặc bạn không có quyền chỉnh sửa nó'}, 
                            status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)