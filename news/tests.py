import pytest
from django.urls import reverse
from django.utils import timezone

from portfolios.models import Asset, Portfolio
from .models import NewsArticle, NewsSource


@pytest.fixture
def portfolio(db, user):
    return Portfolio.objects.create(user=user, name='Carteira')


@pytest.fixture
def asset(db, portfolio):
    return Asset.objects.create(
        portfolio=portfolio,
        ticker='PETR4',
        name='Petrobras',
        asset_type=Asset.AssetType.STOCK,
    )


@pytest.fixture
def news_source(db):
    return NewsSource.objects.create(name='Yahoo Finance', slug='yfinance', is_active=True)


@pytest.fixture
def article(db, news_source, asset):
    article = NewsArticle.objects.create(
        source=news_source,
        title='Petrobras anuncia dividendos',
        url='https://example.com/news/1',
        published_at=timezone.now(),
    )
    article.tickers.add(asset)
    return article


@pytest.mark.django_db
class TestGlobalNews:
    def test_returns_news_for_user_assets(self, auth_client, article):
        url = reverse('news-global')
        response = auth_client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['title'] == 'Petrobras anuncia dividendos'

    def test_does_not_return_unrelated_news(self, auth_client, news_source, db):
        other_article = NewsArticle.objects.create(
            source=news_source,
            title='Notícia não relacionada',
            url='https://example.com/news/2',
            published_at=timezone.now(),
        )
        url = reverse('news-global')
        response = auth_client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 0

    def test_unauthenticated_returns_401(self, api_client):
        url = reverse('news-global')
        response = api_client.get(url)
        assert response.status_code == 401


@pytest.mark.django_db
class TestPortfolioNews:
    def test_returns_news_for_portfolio(self, auth_client, portfolio, article):
        url = reverse('news-portfolio', kwargs={'portfolio_pk': portfolio.pk})
        response = auth_client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_nonexistent_portfolio_returns_404(self, auth_client):
        url = reverse('news-portfolio', kwargs={'portfolio_pk': 9999})
        response = auth_client.get(url)
        assert response.status_code == 404

    def test_cannot_access_other_users_portfolio_news(self, auth_client, other_user, news_source, db):
        other_portfolio = Portfolio.objects.create(user=other_user, name='Alheia')
        url = reverse('news-portfolio', kwargs={'portfolio_pk': other_portfolio.pk})
        response = auth_client.get(url)
        assert response.status_code == 404
