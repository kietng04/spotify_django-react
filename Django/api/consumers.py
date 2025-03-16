import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation, Message, MyUser
from django.utils import timezone

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_name = f"user_{self.user_id}"
        self.room_group_name = f"chat_{self.room_name}"

        # Tham gia vào nhóm
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Rời khỏi nhóm
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    # Nhận tin nhắn từ WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_content = data['message']
        recipient_id = data['recipient_id']
        sender_id = self.user_id
        
        # Lưu tin nhắn vào cơ sở dữ liệu
        conversation, message = await self.save_message(sender_id, recipient_id, message_content)
        
        # Gửi tin nhắn đến nhóm của người nhận
        await self.channel_layer.group_send(
            f"chat_user_{recipient_id}",
            {
                'type': 'chat_message',
                'message': message_content,
                'sender_id': sender_id,
                'conversation_id': conversation.id,
                'timestamp': message.timestamp.isoformat()
            }
        )
        
    # Nhận tin nhắn từ room group
    async def chat_message(self, event):
        # Gửi tin nhắn tới WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'conversation_id': event['conversation_id'],
            'timestamp': event['timestamp']
        }))
        
    @database_sync_to_async
    def save_message(self, sender_id, recipient_id, content):
        sender = MyUser.objects.get(id=sender_id)
        recipient = MyUser.objects.get(id=recipient_id)
        
        # Tìm hoặc tạo cuộc hội thoại giữa 2 người dùng
        conversations = Conversation.objects.filter(participants=sender).filter(participants=recipient)
        if conversations.exists():
            conversation = conversations.first()
        else:
            conversation = Conversation.objects.create()
            conversation.participants.add(sender, recipient)
            conversation.save()
            
        # Tạo tin nhắn mới
        message = Message.objects.create(
            conversation=conversation,
            sender=sender,
            content=content
        )
        
        return conversation, message