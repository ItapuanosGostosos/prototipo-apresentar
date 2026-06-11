from rest_framework import serializers


class LiveNewsArticleSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    title = serializers.CharField()
    summary = serializers.CharField()
    url = serializers.URLField()
    thumbnail_url = serializers.CharField()
    published_at = serializers.DateTimeField()
    source = serializers.SerializerMethodField()
    tickers = serializers.ListField(child=serializers.CharField(), source='related_tickers')

    def get_id(self, obj):
        return hash(obj.url) & 0x7FFFFFFF

    def get_source(self, obj):
        return {'id': 1, 'name': 'Yahoo Finance', 'slug': 'yfinance'}
