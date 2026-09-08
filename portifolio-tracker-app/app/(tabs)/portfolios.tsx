import { useState, type ReactNode } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  Modal, ActivityIndicator, Alert, ScrollView,
  TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { C, R, TAB_BAR_SPACE } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import {
  Chip, DashedAddButton, EmptyState, FieldLabel, GhostButton, GlassCard,
  IconBubble, Input, PrimaryButton, ScreenHeader, type IconName,
} from '../../src/components/ui/primitives';
import {
  listPortfolios, getPortfolio, createPortfolio,
  deletePortfolio, addAsset, removeAsset,
} from '../../src/services/portfolios';
import type { Asset, AssetType, PortfolioListItem } from '../../src/types';

const ASSET_TYPES: { value: AssetType; label: string; icon: IconName }[] = [
  { value: 'stock', label: 'Ação',   icon: 'trending-up-outline' },
  { value: 'fii',   label: 'FII',    icon: 'business-outline' },
  { value: 'crypto',label: 'Cripto', icon: 'logo-bitcoin' },
  { value: 'etf',   label: 'ETF',    icon: 'layers-outline' },
  { value: 'bdr',   label: 'BDR',    icon: 'globe-outline' },
];

const TYPE_COLORS: Record<AssetType, { bg: string; text: string }> = {
  stock:  { bg: C.successSoft, text: C.success },
  fii:    { bg: C.infoSoft,    text: C.info },
  crypto: { bg: C.warningSoft, text: C.warning },
  etf:    { bg: 'rgba(179,156,255,0.18)', text: '#B39CFF' },
  bdr:    { bg: 'rgba(242,123,155,0.16)', text: C.pink },
};

/**
 * Bottom sheet compartilhado pelos modais de criar portfólio e adicionar ativo.
 * - Altura definida pelo conteúdo (sem alturas fixas), encolhendo e rolando se não couber.
 * - iOS: KeyboardAvoidingView "padding" empurra o sheet acima do teclado.
 * - Android: a janela do Modal já redimensiona com o teclado (adjustResize), então não
 *   compensamos de novo — evita o espaço vazio acima dos campos.
 * - Toque no fundo escuro fecha; o conteúdo do sheet não propaga o toque.
 */
function SheetModal({ visible, title, onClose, children }: {
  visible: boolean; title: string; onClose: () => void; children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Fechar">
          <View style={s.overlayBackdrop} />
        </TouchableWithoutFeedback>
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <ScrollView
            keyboardShouldPersistTaps="handled"
            bounces={false}
            contentContainerStyle={[s.sheetContent, { paddingBottom: Math.max(insets.bottom, 16) }]}
          >
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={8} accessibilityLabel="Fechar">
                <IconBubble name="close" size={32} color={C.textSec} />
              </TouchableOpacity>
            </View>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Tile de ativo em grade 2 colunas (Figma "Wallet"): ícone circular, ticker, nome e tipo. */
function AssetTile({ asset, onRemove }: { asset: Asset; onRemove: () => void }) {
  const col = TYPE_COLORS[asset.asset_type] ?? TYPE_COLORS.stock;
  const typeInfo = ASSET_TYPES.find((t) => t.value === asset.asset_type);
  return (
    <GlassCard style={s.tile}>
      <View style={s.tileTop}>
        <IconBubble name={typeInfo?.icon ?? 'trending-up-outline'} size={42} color={col.text} bg={col.bg} />
        <TouchableOpacity style={s.tileRemove} onPress={onRemove} hitSlop={8} accessibilityLabel={`Remover ${asset.ticker}`}>
          <Ionicons name="close" size={14} color="#FF8A8A" />
        </TouchableOpacity>
      </View>
      <Text style={s.tileTicker}>{asset.ticker}</Text>
      <Text style={s.tileName} numberOfLines={1}>{asset.name}</Text>
      <View style={[s.typeTag, { backgroundColor: col.bg, borderColor: col.text + '55' }]}>
        <Text style={[s.typeTagText, { color: col.text }]}>{typeInfo?.label ?? asset.asset_type}</Text>
      </View>
    </GlassCard>
  );
}

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

  function confirmDelete(p: PortfolioListItem) {
    Alert.alert('Excluir', `Excluir "${p.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteMutation.mutate(p.id) },
    ]);
  }

  function confirmRemove(asset: Asset) {
    Alert.alert('Remover', `Remover ${asset.ticker}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => removeMutation.mutate(asset.id) },
    ]);
  }

  const selected = portfolios?.find((p) => p.id === selectedId);
  const assetCount = detail?.assets.length ?? 0;

  if (isLoading) {
    return (
      <View style={[s.root, s.centered]}>
        <DecoBackground />
        <ActivityIndicator color={C.accentLt} size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={s.page} edges={['top', 'left', 'right']}>
        <ScreenHeader
          title="Carteira"
          right={<GhostButton label="Novo" icon="add" onPress={() => setShowCreate(true)} />}
        />

        {/* Portfólios (chips) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabRow}>
          {(portfolios ?? []).length === 0 ? (
            <Text style={s.emptyInline}>Nenhum portfólio criado.</Text>
          ) : (
            (portfolios ?? []).map((p: PortfolioListItem) => (
              <Chip
                key={p.id}
                label={p.name}
                icon="wallet-outline"
                count={p.asset_count}
                active={selectedId === p.id}
                onPress={() => setSelectedId(p.id)}
                onLongPress={() => confirmDelete(p)}
              />
            ))
          )}
        </ScrollView>

        {/* Ativos */}
        {!selectedId ? (
          <View style={s.centered}>
            <EmptyState
              icon="wallet-outline"
              title="Nenhum portfólio selecionado"
              description="Selecione ou crie um portfólio para ver seus ativos."
            />
          </View>
        ) : loadingDetail ? (
          <ActivityIndicator color={C.accentLt} style={{ marginTop: 40 }} />
        ) : (
          <View style={s.assetSection}>
            <View style={s.assetHeader}>
              <View>
                <Text style={s.assetSectionTitle}>Ativos</Text>
                {selected ? (
                  <Text style={s.assetSectionSub}>
                    {selected.name} · {assetCount} {assetCount === 1 ? 'ativo' : 'ativos'}
                  </Text>
                ) : null}
              </View>
              <View style={s.assetActions}>
                {selected ? (
                  <TouchableOpacity onPress={() => confirmDelete(selected)} hitSlop={8} accessibilityLabel="Excluir portfólio">
                    <IconBubble name="trash-outline" size={38} color="#FF8A8A" />
                  </TouchableOpacity>
                ) : null}
                <GhostButton label="Adicionar" icon="add" onPress={() => setShowAddAsset(true)} />
              </View>
            </View>

            {!detail?.assets.length ? (
              <View style={s.emptyAssets}>
                <EmptyState icon="stats-chart-outline" title="Nenhum ativo ainda" description="Adicione seu primeiro ativo a este portfólio." />
                <DashedAddButton label="Adicionar ativo" onPress={() => setShowAddAsset(true)} style={s.emptyAdd} />
              </View>
            ) : (
              <FlatList
                data={detail.assets}
                keyExtractor={(i) => String(i.id)}
                numColumns={2}
                columnWrapperStyle={s.gridRow}
                contentContainerStyle={s.grid}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => <AssetTile asset={item} onRemove={() => confirmRemove(item)} />}
                ListFooterComponent={<DashedAddButton onPress={() => setShowAddAsset(true)} style={s.footerAdd} />}
              />
            )}
          </View>
        )}

        {/* Modal: criar portfólio */}
        <SheetModal visible={showCreate} title="Novo portfólio" onClose={() => setShowCreate(false)}>
          <FieldLabel>Nome</FieldLabel>
          <Input placeholder="Ex: Longo prazo" value={newName} onChangeText={setNewName} style={s.sheetInput} />
          <PrimaryButton
            label="Criar"
            disabled={!newName.trim()}
            loading={createMutation.isPending}
            onPress={() => createMutation.mutate(newName.trim())}
          />
        </SheetModal>

        {/* Modal: adicionar ativo */}
        <SheetModal visible={showAddAsset} title="Adicionar ativo" onClose={() => setShowAddAsset(false)}>
          <FieldLabel>Ticker</FieldLabel>
          <Input placeholder="Ex: PETR4, BTC" value={ticker} onChangeText={setTicker} autoCapitalize="characters" style={s.sheetInput} />
          <FieldLabel>Nome</FieldLabel>
          <Input placeholder="Ex: Petrobras PN" value={assetName} onChangeText={setAssetName} style={s.sheetInput} />
          <FieldLabel>Tipo</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.typeScroll} contentContainerStyle={s.typeRow} keyboardShouldPersistTaps="handled">
            {ASSET_TYPES.map((t) => (
              <Chip key={t.value} label={t.label} icon={t.icon} active={assetType === t.value} onPress={() => setAssetType(t.value)} />
            ))}
          </ScrollView>
          <PrimaryButton
            label="Adicionar"
            disabled={!ticker.trim() || !assetName.trim()}
            loading={addMutation.isPending}
            onPress={() => addMutation.mutate()}
          />
        </SheetModal>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  // Largura máxima do conteúdo em telas largas (web/tablet)
  page: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: TAB_BAR_SPACE / 2 },
  emptyInline: { color: C.textMuted, fontSize: 14, paddingVertical: 8 },

  // Sem altura fixa: a linha de chips tem a altura do próprio conteúdo.
  tabScroll: { flexGrow: 0, flexShrink: 0, marginBottom: 4 },
  tabRow: { paddingHorizontal: 20, paddingVertical: 4, gap: 8, alignItems: 'flex-start' },

  assetSection: { flex: 1, paddingHorizontal: 20 },
  assetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, marginTop: 6,
  },
  assetSectionTitle: { color: C.text, fontSize: 18, fontWeight: '600' },
  assetSectionSub: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  assetActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  grid: { paddingBottom: TAB_BAR_SPACE, gap: 12 },
  gridRow: { gap: 12 },
  tile: { flex: 1, padding: 14, minHeight: 132, gap: 4 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  tileRemove: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: C.dangerSoft, alignItems: 'center', justifyContent: 'center',
  },
  tileTicker: { color: C.text, fontWeight: '700', fontSize: 17, letterSpacing: 0.2 },
  tileName: { color: C.textMuted, fontSize: 12, marginBottom: 6 },
  typeTag: { alignSelf: 'flex-start', borderRadius: R.pill, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3 },
  typeTagText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  footerAdd: { marginTop: 4 },
  emptyAssets: { alignItems: 'center', marginTop: 28, gap: 20 },
  emptyAdd: { alignSelf: 'stretch' },

  overlay: { flex: 1, backgroundColor: 'rgba(5,3,12,0.72)', justifyContent: 'flex-end' },
  overlayBackdrop: { flexGrow: 1, flexShrink: 0, minHeight: 48 },
  sheet: {
    backgroundColor: C.bgSolid, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderBottomWidth: 0, borderColor: C.border,
    width: '100%', maxWidth: 560, alignSelf: 'center', flexShrink: 1,
  },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)', marginTop: 10 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 12 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { color: C.text, fontSize: 20, fontWeight: '700' },
  sheetInput: { marginBottom: 16 },
  typeScroll: { flexGrow: 0, marginBottom: 20 },
  typeRow: { gap: 8, alignItems: 'center', paddingVertical: 2 },
});
