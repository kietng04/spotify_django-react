from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoginView, LoginWithGoogleView, RandomTracksView, TrackSearchView
from .views import StreamAudioView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (UserViewSet, LoginView, LoginWithGoogleView, ConversationListView, UserSearchView, ConversationCreateView, ConversationSearchView,
                   RandomTracksView, TrackSearchView, StreamAudioView, LikeTrackView, TokenValidationView, CheckLikeStatusView, LikedTracksView, MessageListView, AdminUserListView, PublicUserListView)
router = DefaultRouter()
router.register('users', UserViewSet)
urlpatterns = [
    path('', include(router.urls)),
    path('login/', LoginView.as_view(), name='login'),
    path('google-auth/', LoginWithGoogleView.as_view(), name='google-auth'),
    path('random-tracks/', RandomTracksView.as_view(), name='random-tracks'),
    path('stream/<int:track_id>/', StreamAudioView.as_view(), name='stream-audio'),
    path('search/tracks/', views.TrackSearchView.as_view(), name='search-tracks'),
    path('liketrack/', LikeTrackView.as_view(), name='like-track'),
    path('validate-token/', TokenValidationView.as_view(), name='validate-token'),
    path('check-like-status/', CheckLikeStatusView.as_view(), name='check-like-status'),
    path('liked-tracks/', LikedTracksView.as_view(), name='liked-tracks'),
    path('messages/<int:conversation_id>/', MessageListView.as_view(), name='messages'),
    path('conversations/', ConversationListView.as_view(), name='conversations'),
    path('user-search/', UserSearchView.as_view(), name='user-search'),
    path('conversations/create/', ConversationCreateView.as_view(), name='conversation-create'),
    path('conversations/search/', ConversationSearchView.as_view(), name='conversation-search'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('users/list/', PublicUserListView.as_view(), name='public-user-list'),
    path('users/list/', public_users_list, name='public-users-list'),
   path('users/<int:user_id>/deactivate/', deactivate_user, name='deactivate-user')


]