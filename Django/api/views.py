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
import sys
import logging
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
            
            # Return both messages
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