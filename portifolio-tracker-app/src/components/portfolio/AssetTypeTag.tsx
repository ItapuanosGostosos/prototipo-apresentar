import { View, Text, StyleSheet } from 'react-native';
import type { AssetType } from '../../types';

const TYPE_CONFIG: Record<AssetType, { label: string; color: string; bg: string }> = {
  stock: { label: 'Ação', color: '#34d399', bg: '#064e3b' },
  fii: { label: 'FII', color: '#60a5fa', bg: '#1e3a5f' },
  crypto: { label: 'Cripto', color: '#f59e0b', bg: '#451a03' },
  etf: { label: 'ETF', color: '#a78bfa', bg: '#2e1065' },
  bdr: { label: 'BDR', color: '#fb7185', bg: '#4c0519' },
};

export function AssetTypeTag({ type }: { type: AssetType }) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.stock;
  return (
    <View style={[styles.tag, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
