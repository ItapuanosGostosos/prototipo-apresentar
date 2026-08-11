import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput,
  Modal, ActivityIndicator, Alert, ScrollView,
  TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { C } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import {
  listPortfolios, getPortfolio, createPortfolio,
  deletePortfolio, addAsset, removeAsset,
} from '../../src/services/portfolios';
import type { AssetType, PortfolioListItem } from '../../src/types';

const ASSET_TYPES: { value: AssetType; label: string; icon: string }[] = [
  { value: 'stock', label: 'Ação',   icon: '📈' },
  { value: 'fii',   label: 'FII',    icon: '🏢' },
  { value: 'crypto',label: 'Cripto', icon: '₿' },
  { value: 'etf',   label: 'ETF',    icon: '📦' },
  { value: 'bdr',   label: 'BDR',    icon: '🌎' },
];

const TYPE_COLORS: Record<AssetType, { bg: string; text: string }> = {
  stock:  { bg: '#1e3a5f', text: '#60a5fa' },
  fii:    { bg: '#1a3a2a', text: '#4ade80' },
  crypto: { bg: '#2d1b4e', text: '#c084fc' },
  etf:    { bg: '#3a2a0a', text: '#fbbf24' },
  bdr:    { bg: '#1e2a40', text: '#38bdf8' },
};

export default function PortfoliosScreen() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newName, setNewName] = useState('');
  const [ticker, setTicker] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('stock');

  const { data: portfolios, isLoading } = useQuery({ queryKey: ['portfolios'], queryFn: listPortfolios });
  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ['portfolio', selectedId],
    queryFn: () => getPortfolio(selectedId!),
    enabled: selectedId !== null,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createPortfolio({ name }),
    onSuccess: (p) => { qc.invalidateQueries({ queryKey: ['portfolios'] }); setShowCreate(false); setNewName(''); setSelectedId(p.id); },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePortfolio,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolios'] }); setSelectedId(null); },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  });

  const addMutation = useMutation({
    mutationFn: () => addAsset(selectedId!, { ticker: ticker.trim().toUpperCase(), name: assetName.trim(), asset_type: assetType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio', selectedId] });
      qc.invalidateQueries({ queryKey: ['portfolios'] });
      setShowAddAsset(false); setTicker(''); setAssetName(''); setAssetType('stock');
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (assetId: number) => removeAsset(selectedId!, assetId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio', selectedId] }); qc.invalidateQueries({ queryKey: ['portfolios'] }); },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  });

  if (isLoading) {
    return <View style={[s.root, s.centered]}><ActivityIndicator color={C.accentLt} size="large" /></View>;
  }

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Carteira</Text>
          <TouchableOpacity style={s.addPortfolioBtn} onPress={() => setShowCreate(true)}>
            <Ionicons name="add" color={C.accentLt} size={18} />
            <Text style={s.addPortfolioBtnText}>Novo</Text>
          </TouchableOpacity>
        </View>

        {/* Portfolio tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabRow}>
          {(portfolios ?? []).map((p: PortfolioListItem) => (
            <TouchableOpacity
              key={p.id}
              style={[s.tab, selectedId === p.id && s.tabActive]}
              onPress={() => setSelectedId(p.id)}
              onLongPress={() => Alert.alert('Excluir', `Excluir "${p.name}"?`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Excluir', style: 'destructive', onPress: () => deleteMutation.mutate(p.id) },
              ])}
            >
              <Text style={[s.tabText, selectedId === p.id && s.tabTextActive]}>{p.name}</Text>
              <Text style={s.tabCount}>{p.asset_count} ativos</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Asset grid */}
        {!selectedId ? (
          <View style={s.centered}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>💼</Text>
            <Text style={s.emptyText}>Selecione ou crie um portfólio.</Text>
          </View>
        ) : loadingDetail ? (
          <ActivityIndicator color={C.accentLt} style={{ marginTop: 40 }} />
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            <View style={s.assetHeader}>
              <Text style={s.assetSectionTitle}>Ativos</Text>
              <TouchableOpacity style={s.addAssetBtn} onPress={() => setShowAddAsset(true)}>
                <Ionicons name="add" color={C.accentLt} size={16} />
                <Text style={s.addAssetBtnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {!detail?.assets.length ? (
              <View style={[s.centered, { flex: 1 }]}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>📊</Text>
                <Text style={s.emptyText}>Nenhum ativo ainda.{'\n'}Toque em Adicionar!</Text>
              </View>
            ) : (
              <FlatList
                data={detail.assets}
                keyExtractor={(i) => String(i.id)}
                numColumns={2}
                columnWrapperStyle={s.gridRow}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item }) => {
                  const col = TYPE_COLORS[item.asset_type] ?? TYPE_COLORS.stock;
                  const typeInfo = ASSET_TYPES.find((t) => t.value === item.asset_type);
                  return (
                    <View style={[s.assetCard, { borderColor: col.text + '44' }]}>
                      <View style={[s.assetIconBg, { backgroundColor: col.bg }]}>
                        <Text style={{ fontSize: 22 }}>{typeInfo?.icon ?? '📈'}</Text>
                      </View>
                      <Text style={[s.assetTicker, { color: col.text }]}>{item.ticker}</Text>
                      <Text style={s.assetName} numberOfLines={1}>{item.name}</Text>
                      <View style={[s.assetType, { backgroundColor: col.bg }]}>
                        <Text style={[s.assetTypeText, { color: col.text }]}>{typeInfo?.label ?? item.asset_type}</Text>
                      </View>
                      <TouchableOpacity
                        style={s.removeBtn}
                        onPress={() => Alert.alert('Remover', `Remover ${item.ticker}?`, [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Remover', style: 'destructive', onPress: () => removeMutation.mutate(item.id) },
                        ])}
                      >
                        <Ionicons name="close" color="#f87171" size={14} />
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            )}
          </View>
        )}

        {/* Modal: criar portfólio */}
        <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
          <TouchableWithoutFeedback onPress={() => setShowCreate(false)}>
            <View style={s.overlay}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={s.sheet} onStartShouldSetResponder={() => true}>
                  <Text style={s.sheetTitle}>Novo portfólio</Text>
                  <TextInput
                    style={s.input}
                    placeholder="Nome do portfólio"
                    placeholderTextColor={C.textMuted}
                    value={newName}
                    onChangeText={setNewName}
                  />
                  <TouchableOpacity
                    style={[s.sheetBtn, !newName.trim() && { opacity: 0.4 }]}
                    disabled={!newName.trim() || createMutation.isPending}
                    onPress={() => createMutation.mutate(newName.trim())}
                  >
                    {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.sheetBtnText}>Criar</Text>}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Modal: adicionar ativo */}
        <Modal visible={showAddAsset} transparent animationType="slide" onRequestClose={() => setShowAddAsset(false)}>
          <TouchableWithoutFeedback onPress={() => setShowAddAsset(false)}>
            <View style={s.overlay}>
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={s.sheet} onStartShouldSetResponder={() => true}>
                  <Text style={s.sheetTitle}>Adicionar ativo</Text>
                  <Text style={s.inputLabel}>Ticker</Text>
                  <TextInput
                    style={s.input}
                    placeholder="Ex: PETR4, BTC"
                    placeholderTextColor={C.textMuted}
                    value={ticker}
                    onChangeText={setTicker}
                    autoCapitalize="characters"
                  />
                  <Text style={s.inputLabel}>Nome</Text>
                  <TextInput
                    style={s.input}
                    placeholder="Ex: Petrobras PN"
                    placeholderTextColor={C.textMuted}
                    value={assetName}
                    onChangeText={setAssetName}
                  />
                  <Text style={s.inputLabel}>Tipo</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                    {ASSET_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t.value}
                        style={[s.typeOpt, assetType === t.value && s.typeOptActive]}
                        onPress={() => setAssetType(t.value)}
                      >
                        <Text>{t.icon}</Text>
                        <Text style={[s.typeOptText, assetType === t.value && s.typeOptTextActive]}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={[s.sheetBtn, (!ticker.trim() || !assetName.trim()) && { opacity: 0.4 }]}
                    disabled={!ticker.trim() || !assetName.trim() || addMutation.isPending}
                    onPress={() => addMutation.mutate()}
                  >
                    {addMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.sheetBtnText}>Adicionar</Text>}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { color: C.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { color: C.text, fontSize: 24, fontWeight: '700' },
  addPortfolioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.bgCard, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: C.border,
  },
  addPortfolioBtnText: { color: C.accentLt, fontWeight: '600', fontSize: 14 },
  tabScroll: { height: 72, marginBottom: 8 },
  tabRow: { paddingHorizontal: 20, gap: 10, alignItems: 'center' },
  tab: {
    backgroundColor: C.bgCard, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: C.border, minWidth: 110,
  },
  tabActive: { backgroundColor: '#1e0d4e', borderColor: C.accent },
  tabText: { color: C.textMuted, fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: C.accentLt },
  tabCount: { color: C.textMuted, fontSize: 11, marginTop: 2 },

  assetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  assetSectionTitle: { color: C.text, fontSize: 18, fontWeight: '600' },
  addAssetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.bgCard, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: C.border,
  },
  addAssetBtnText: { color: C.accentLt, fontSize: 13, fontWeight: '600' },

  gridRow: { gap: 12, marginBottom: 12 },
  assetCard: {
    flex: 1, backgroundColor: C.bgCard, borderRadius: 16, padding: 14,
    borderWidth: 1, alignItems: 'flex-start', position: 'relative',
  },
  assetIconBg: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  assetTicker: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  assetName: { color: C.textMuted, fontSize: 11, marginBottom: 8 },
  assetType: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  assetTypeText: { fontSize: 10, fontWeight: '700' },
  removeBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#2d0707', justifyContent: 'center', alignItems: 'center',
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, borderTopWidth: 1, borderColor: C.border,
  },
  sheetTitle: { color: C.text, fontSize: 20, fontWeight: '700', marginBottom: 20 },
  inputLabel: { color: C.textSec, fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  input: {
    backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 14, color: C.text, fontSize: 15, marginBottom: 16,
  },
  typeOpt: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, marginRight: 8,
  },
  typeOptActive: { borderColor: C.accent, backgroundColor: '#1e0d4e' },
  typeOptText: { color: C.textMuted, fontWeight: '600', fontSize: 13 },
  typeOptTextActive: { color: C.accentLt },
  sheetBtn: {
    backgroundColor: C.accent, borderRadius: 12, padding: 16, alignItems: 'center',
  },
  sheetBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
