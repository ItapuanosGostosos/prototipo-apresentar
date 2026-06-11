from django.urls import path

from .views import GlobalNewsListView, PortfolioNewsListView

urlpatterns = [
    path('', GlobalNewsListView.as_view(), name='news-global'),
    path('portfolio/<int:portfolio_pk>', PortfolioNewsListView.as_view(), name='news-portfolio'),
]
