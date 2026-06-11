from django.contrib import admin
from django.urls import include, path, re_path

urlpatterns = [
    path('admin/', admin.site.urls),
    # re_path permite bater tanto /api/auth/register quanto /api/auth/  (com ou sem slash antes do sub-path)
    re_path(r'^api/auth(?:/|$)', include('users.urls')),
    re_path(r'^api/portfolios(?:/|$)', include('portfolios.urls')),
    re_path(r'^api/news(?:/|$)', include('news.urls')),
    re_path(r'^api/notifications(?:/|$)', include('notifications.urls')),
]
