from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, LoginView, LoginWithGoogleView, RandomTracksView, TrackSearchView
from .views import StreamAudioView
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
router = DefaultRouter()
router.register('users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', LoginView.as_view(), name='login'),
    path('google-auth/', LoginWithGoogleView.as_view(), name='google-auth'),
    path('random-tracks/', RandomTracksView.as_view(), name='random-tracks'),
    path('stream/<int:track_id>/', StreamAudioView.as_view(), name='stream-audio'),
    path('search/tracks/', views.TrackSearchView.as_view(), name='search-tracks'),
]