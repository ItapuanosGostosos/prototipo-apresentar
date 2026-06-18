import logging

from rest_framework import generics, permissions
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from portfolios.models import Asset, Portfolio
from .fetchers.yfinance_fetcher import YFinanceFetcher
from .models import Analysis
from .dto import AnalysisSerializer, LiveNewsArticleSerializer

logger = logging.getLogger(__name__)

_fetcher = YFinanceFetcher()

FALLBACK_TICKERS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'MGLU3', 'WEGE3', 'BTC-USD']


def _fetch_live(tickers: list[str]) -> list:
    def _do_fetch(symbols):
        try:
            results = _fetcher.fetch(symbols)
        except Exception as exc:
            logger.error('Live fetch error: %s', exc)
            return []
        results.sort(key=lambda a: a.published_at, reverse=True)
        return results

    if tickers:
        articles = _do_fetch(tickers)
        if articles:
            return articles

    return _do_fetch(FALLBACK_TICKERS)


class GlobalNewsListView(APIView):
    """Real-time news for all assets across all user portfolios."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        tickers = list(
            Asset.objects.filter(portfolio__user=request.user)
            .values_list('ticker', flat=True)
            .distinct()
        )
        articles = _fetch_live(tickers)
        return Response(LiveNewsArticleSerializer(articles, many=True).data)


class PortfolioNewsListView(APIView):
    """Real-time news for all assets in a specific portfolio."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, portfolio_pk):
        try:
            portfolio = Portfolio.objects.get(pk=portfolio_pk, user=request.user)
        except Portfolio.DoesNotExist:
            raise NotFound('Portfolio not found.')

        tickers = list(portfolio.assets.values_list('ticker', flat=True).distinct())
        articles = _fetch_live(tickers)
        return Response(LiveNewsArticleSerializer(articles, many=True).data)


class AnalysisDetailView(generics.RetrieveAPIView):
    """GET: retrieve a single sentiment analysis by ID."""
    serializer_class = AnalysisSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        user_tickers = Asset.objects.filter(
            portfolio__user=user
        ).values_list('ticker', flat=True).distinct()
        return Analysis.objects.filter(ticker__in=user_tickers).select_related('article')
