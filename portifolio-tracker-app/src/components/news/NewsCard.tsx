import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import type { NewsArticle } from '../../types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  function handleOpen() {
    Linking.openURL(article.url);
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handleOpen} activeOpacity={0.75}>
      {article.thumbnail_url ? (
        <Image
          source={{ uri: article.thumbnail_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : null}

      <View style={styles.body}>
        <View style={styles.meta}>
          {article.source && (
            <Text style={styles.source}>{article.source.name}</Text>
          )}
          <Text style={styles.date}>{formatDate(article.published_at)}</Text>
        </View>

        <Text style={styles.title} numberOfLines={3}>
          {article.title}
        </Text>

        {article.summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {article.summary}
          </Text>
        ) : null}

        {article.tickers.length > 0 && (
          <View style={styles.tickerRow}>
            {article.tickers.map((ticker) => (
              <View key={ticker} style={styles.tickerBadge}>
                <Text style={styles.tickerText}>{ticker}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: '#334155',
  },
  body: {
    padding: 14,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  source: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  date: {
    color: '#475569',
    fontSize: 11,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 6,
  },
  summary: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  tickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tickerBadge: {
    backgroundColor: '#0f172a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tickerText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
});
