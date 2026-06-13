from django.db import models


class Analysis(models.Model):
    """Sentiment analysis produced by IA over a news article."""
    article = models.ForeignKey('NewsArticle', on_delete=models.CASCADE, related_name='analyses')
    analise = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'analises'

    def __str__(self):
        return f'Analysis #{self.pk} for article #{self.article_id}'


class NewsSource(models.Model):
    """Registry of news sources/integrations. Add a new row to plug a new hub."""
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'news_sources'

    def __str__(self):
        return self.name


class NewsArticle(models.Model):
    source = models.ForeignKey(NewsSource, on_delete=models.SET_NULL, null=True, related_name='articles')
    title = models.CharField(max_length=500)
    summary = models.TextField(blank=True)
    url = models.URLField(max_length=500, unique=True)
    thumbnail_url = models.URLField(max_length=500, blank=True)
    published_at = models.DateTimeField()
    tickers = models.ManyToManyField('portfolios.Asset', related_name='news', blank=True)
    fetched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'news_articles'
        ordering = ['-published_at']

    def __str__(self):
        return self.title
