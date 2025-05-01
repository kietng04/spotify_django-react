from django.contrib import admin
from .models import Track, Artist, Album, Genre

# Register your models here.
admin.site.register(Track)
admin.site.register(Artist)
admin.site.register(Album)
admin.site.register(Genre)
# Đăng ký thêm các model khác nếu cần
