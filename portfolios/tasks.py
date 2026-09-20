import logging

from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded

from django.conf import settings
from django.db import transaction

from news.fetchers.google_news_fetcher import GoogleNewsFetcher
from news.fetchers.yfinance_fetcher import YFinanceFetcher
from news.models import NewsArticle, NewsSource
from sentiment_ai.services import request_analysis

from .models import Asset

logger = logging.getLogger(__name__)

# Fontes consultadas pela analise sob demanda.
#
# Antes desta mudanca a analise usava SOMENTE o Yahoo Finance, que devolve
# materia em ingles. Era por isso que o motor nunca via noticia em portugues:
# nao era o motor que ignorava pt-BR, era o pipeline que nunca entregava.
# O Google News e consultado com hl=pt-BR&gl=BR pelo proprio fetcher.
DEFAULT_ANALYSIS_SOURCES = (
    ('yfinance', 'Yahoo Finance'),
    ('google_news', 'Google News'),
)

_FETCHERS = {
    'yfinance': YFinanceFetcher,
    'google_news': GoogleNewsFetcher,
}


def _analysis_sources():
    configured = getattr(settings, 'SENTIMENT_ANALYSIS_SOURCES', None) or DEFAULT_ANALYSIS_SOURCES
    for slug, name in configured:
        fetcher_cls = _FETCHERS.get(slug)
        if fetcher_cls is None:
            logger.warning('Sem fetcher registrado para a fonte "%s", ignorando.', slug)
            continue
        yield slug, name, fetcher_cls()


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
    reject_on_worker_lost=True,
    soft_time_limit=240,
    time_limit=300,
)
def analyse_portfolio(self, portfolio_id: int, tickers: list[str]):
    """Fetch portfolio news and enqueue sentiment analysis outside the HTTP request."""
    try:
        tickers_set = {ticker.upper() for ticker in tickers}
        articles_queued = 0
        articles_skipped = 0
        seen_urls: set[str] = set()

        for slug, name, fetcher in _analysis_sources():
            source, _ = NewsSource.objects.get_or_create(
                slug=slug,
                defaults={'name': name, 'is_active': True},
            )

            try:
                fetched = fetcher.fetch(tickers)
            except Exception as exc:
                # Uma fonte fora do ar nao pode derrubar a analise inteira.
                logger.error('Fonte %s falhou na analise da carteira %s: %s', slug, portfolio_id, exc)
                continue

            for article in fetched:
                if not article.url or article.url in seen_urls:
                    continue
                seen_urls.add(article.url)

                # Um artigo problematico nao pode derrubar a carteira inteira.
                # Era o que acontecia: uma URL do Google News acima do limite da
                # coluna estourava ORA-12899 e abortava a task, entao os tickers
                # seguintes da carteira nunca chegavam a ser analisados.
                try:
                    with transaction.atomic():
                        obj, _ = NewsArticle.objects.get_or_create(
                            url=article.url,
                            defaults={
                                'source': source,
                                'title': article.title,
                                'summary': article.summary or '',
                                'thumbnail_url': article.thumbnail_url or '',
                                'published_at': article.published_at,
                            },
                        )
                        related_assets = Asset.objects.filter(
                            portfolio_id=portfolio_id,
                            ticker__in=article.related_tickers,
                        )
                        if related_assets.exists():
                            obj.tickers.add(*related_assets)
                except Exception as exc:
                    articles_skipped += 1
                    logger.warning(
                        'Artigo ignorado na carteira %s (%s...): %s',
                        portfolio_id, article.url[:70], exc,
                    )
                    continue

                for ticker in {t.upper() for t in article.related_tickers}:
                    if ticker in tickers_set:
                        request_analysis(article_id=obj.pk, ticker=ticker)
                        articles_queued += 1

        logger.info(
            'Portfolio analysis %s queued %s article analyses (%s artigos ignorados).',
            portfolio_id,
            articles_queued,
            articles_skipped,
        )
        return {
            'portfolio_id': portfolio_id,
            'articles_queued': articles_queued,
            'articles_skipped': articles_skipped,
        }
    except SoftTimeLimitExceeded as exc:
        logger.error('Portfolio analysis %s exceeded its soft time limit.', portfolio_id)
        raise self.retry(exc=exc)
    except Exception as exc:
        logger.exception('Portfolio analysis %s failed.', portfolio_id)
        raise self.retry(exc=exc)