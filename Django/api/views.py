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
    
class ZaloPayView(APIView):
    authentication_classes = [CustomTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get list of supported banks from ZaloPay"""
        try:
            # ZaloPay configuration
            config = {
                "app_id": 554,
                "key1": "8NdU5pG5R2spGHGhyO99HN1OhD8IQJBn",
                "key2": "uUfsWgfLkRLzq6W2uNXTCxrfxs51auny",
                "endpoint": "https://sbgateway.zalopay.vn/api/getlistmerchantbanks"
            }
            
            # Create request parameters
            reqtime = str(int(round(time() * 1000)))
            data_str = f"{config['app_id']}|{reqtime}"
            
            # Create MAC for security
            mac = hmac.new(
                config['key1'].encode(), 
                data_str.encode(), 
                hashlib.sha256
            ).hexdigest()
            
            # Prepare request data
            request_data = {
                "appid": config["app_id"],
                "reqtime": reqtime,
                "mac": mac
            }
            
            # Send request to ZaloPay
            response = urllib.request.urlopen(
                url=config["endpoint"], 
                data=urllib.parse.urlencode(request_data).encode()
            )
            
            result = json.loads(response.read())
            
            # Return bank list to client
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def post(self, request):
        try:
            # ZaloPay configuration
            config = {
                "app_id": 554,
                "key1": "8NdU5pG5R2spGHGhyO99HN1OhD8IQJBn",
                "key2": "uUfsWgfLkRLzq6W2uNXTCxrfxs51auny",
                "endpoint": "https://sb-openapi.zalopay.vn/v2/create"
            }
            
            # Get amount from request or use default
            amount = request.data.get('amount', 50000)
            user = request.user.username
            
            # Create transaction ID
            transID = random.randrange(1000000)
            
            # Create order data
            order = {
                "app_id": config["app_id"],
                "app_trans_id": "{:%y%m%d}_{}".format(datetime.today(), transID),
                "app_user": user,
                "app_time": int(round(time() * 1000)),
                "embed_data": json.dumps({"redirecturl": "https://42e8-2001-ee0-d708-4130-182a-8954-b404-a656.ngrok-free.app/api/redirect-from-zalopay/"}),
                "item": json.dumps([{}]),
                "amount": amount,
                "description": "Thanh toán đơn hàng #"+str(transID),
                "bank_code": "zalopayapp"
            }
            
            # Create MAC for security
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
            
            # Send request to ZaloPay
            response = urllib.request.urlopen(
                url=config["endpoint"], 
                data=urllib.parse.urlencode(order).encode()
            )
            
            result = json.loads(response.read())
            
            # Return result to client
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

@api_view(['GET'])
@permission_classes([AllowAny])
@csrf_exempt
def zalopay_redirect(request):
    """Handle redirect from ZaloPay after payment"""
    print("Redirect from ZaloPay")
    try:
        # Get parameters from ZaloPay
        data = request.GET
        
        # ZaloPay configuration
        config = {
            "key2": "uUfsWgfLkRLzq6W2uNXTCxrfxs51auny"
        }
        
        # Verify checksum
        checksum_data = "{}|{}|{}|{}|{}|{}|{}".format(
            data.get('appid'), 
            data.get('apptransid'), 
            data.get('pmcid'), 
            data.get('bankcode'), 
            data.get('amount'), 
            data.get('discountamount'), 
            data.get('status')
        )
        
        checksum = hmac.new(
            config['key2'].encode(), 
            checksum_data.encode(), 
            hashlib.sha256
        ).hexdigest()
        
        if checksum != data.get('checksum'):
            # Invalid request
            return redirect(f"http://localhost:3000/payment-failed?error=invalid_checksum")
        
        # Check payment status
        status = data.get('status')
        if status == '1':  # Payment successful
            # TODO: Update payment status in your database
            
            # Redirect to frontend with success status
            return redirect(f"http://localhost:3000/payment-success?order_id={data.get('apptransid')}")
        else:
            # Payment failed
            return redirect(f"http://localhost:3000/payment-failed?error=payment_failed&status={status}")
            
    except Exception as e:
        # Log the error
        print(f"Error in zalopay_redirect: {str(e)}")
        return redirect(f"http://localhost:3000/payment-failed?error=server_error")