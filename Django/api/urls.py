from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoginView, LoginWithGoogleView, RandomTracksView, TrackSearchView
from .views import StreamAudioView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    AddTrackView,
    AdminUserListView,
    BlockUser,
    CheckLikeStatusView,
    ConversationCreateView,
    ConversationListView,
    ConversationsSearchView,
    CreateUserView,
    GeminiAIView,
    LikedTracksView,
    LikeTrackView,
    LoginView,
    LoginWithGoogleView,
    MessageListView,
    PublicUserListView,
    RandomTracksView,
    StreamAudioView,
    TokenValidationView,
    TrackListView,
    TrackSearchView,
    Unblock,
    UpdateUserView,
    UserSearchView,
    UserViewSet,
    ZaloPayView,
    PlaylistView,
    PlaylistFollowView,
    FollowedPlaylistsView,
    PlaylistDetailView,
    PlaylistRemoveTrackView,
    RecommendedTracksView,
    PublicPlaylistsView
)
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
    path('conversations/search/', ConversationsSearchView.as_view(), name='conversation-search'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('userz/list/', PublicUserListView.as_view(), name='public-users-list'),
    path('userz/blockuser/<int:user_id>/', BlockUser.as_view(), name='block-user'),
    path('userz/unblock/<int:user_id>/', Unblock.as_view(), name='unblock'),
    path('userz/add/', CreateUserView.as_view(), name='create-user'),
    path('userz/update/<int:user_id>/', UpdateUserView.as_view(), name='update-user'),  
    path('tracks/list/', TrackListView.as_view(), name='tracks-list'),
    path('tracks/add/', AddTrackView.as_view(), name='add-track'),
    path('zalopay/', ZaloPayView.as_view(), name='zalopay'),
    path('verify-payment/', views.VerifyPaymentView.as_view(), name='verify-payment'),
    path('user-profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('gemini/chat/', GeminiAIView.as_view(), name='gemini-chat'),
    path('playlist/', PlaylistView.as_view(), name='playlist-crud'),
    path('playlist/follow/', PlaylistFollowView.as_view(), name='playlist-follow'),
    path('playlist/followed/', FollowedPlaylistsView.as_view(), name='followed-playlists'),
    path('playlist/<int:playlist_id>/', PlaylistDetailView.as_view(), name='playlist-detail'),
    path('playlist/<int:playlist_id>/add-track/', PlaylistDetailView.as_view(), name='playlist-add-track'),
    path('playlist/<int:playlist_id>/remove/', PlaylistDetailView.as_view(), name='playlist-remove'),
    path('playlist/<int:playlist_id>/remove-track/', views.PlaylistRemoveTrackView.as_view(), name='playlist-remove-track'),
    path('recommended-tracks/', RecommendedTracksView.as_view(), name='recommended-tracks'),
    path('public-playlists/', PublicPlaylistsView.as_view(), name='public-playlists'),
]

