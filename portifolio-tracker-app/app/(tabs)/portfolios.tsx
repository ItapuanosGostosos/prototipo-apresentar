import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listPortfolios,
  getPortfolio,
  createPortfolio,
  deletePortfolio,
  addAsset,
  removeAsset,
} from '../../src/services/portfolios';
import { AssetTypeTag } from '../../src/components/portfolio/AssetTypeTag';
import type { AssetType, PortfolioListItem } from '../../src/types';

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'stock', label: 'Ação' },
  { value: 'fii', label: 'FII' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'etf', label: 'ETF' },
  { value: 'bdr', label: 'BDR' },
];

export default function PortfoliosScreen() {
  const qc = useQueryClient();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [assetTicker, setAssetTicker] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('stock');

  // Listagem de portfólios
  const { data: portfolios, isLoading: loadingPortfolios } = useQuery({
    queryKey: ['portfolios'],
    queryFn: listPortfolios,
  });

  // Detalhe do portfólio selecionado (com ativos)
  const { data: selectedPortfolio, isLoading: loadingDetail } = useQuery({
    queryKey: ['portfolio', selectedPortfolioId],
    queryFn: () => getPortfolio(selectedPortfolioId!),
    enabled: selectedPortfolioId !== null,
  });

  const createPortfolioMutation = useMutation({
    mutationFn: (name: string) => createPortfolio({ name }),
    onSuccess: (portfolio) => {
      qc.invalidateQueries({ queryKey: ['portfolios'] });
      setShowCreatePortfolio(false);
      setNewPortfolioName('');
      setSelectedPortfolioId(portfolio.id);
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: deletePortfolio,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolios'] });
      setSelectedPortfolioId(null);
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  });

  const addAssetMutation = useMutation({
    mutationFn: () =>
      addAsset(selectedPortfolioId!, {
        ticker: assetTicker.trim().toUpperCase(),
        name: assetName.trim(),
        asset_type: assetType,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio', selectedPortfolioId] });
      qc.invalidateQueries({ queryKey: ['portfolios'] });
      setShowAddAsset(false);
      setAssetTicker('');
      setAssetName('');
      setAssetType('stock');
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  });

  const removeAssetMutation = useMutation({
    mutationFn: (assetId: number) => removeAsset(selectedPortfolioId!, assetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio', selectedPortfolioId] });
      qc.invalidateQueries({ queryKey: ['portfolios'] });
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  });

  function confirmDeletePortfolio(id: number, name: string) {
    Alert.alert(
      'Excluir portfólio',
      `Deseja excluir "${name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deletePortfolioMutation.mutate(id) },
      ],
    );
  }

  function confirmRemoveAsset(assetId: number, ticker: string) {
    Alert.alert(
      'Remover ativo',
      `Deseja remover ${ticker} do portfólio?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => removeAssetMutation.mutate(assetId) },
      ],
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loadingPortfolios) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#818cf8" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portfólios</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreatePortfolio(true)}
        >
          <Text style={styles.addButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de portfólios */}
      <FlatList
        data={portfolios ?? []}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.portfolioList}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum portfólio criado.</Text>
        }
        renderItem={({ item }: { item: PortfolioListItem }) => (
          <TouchableOpacity
            style={[
              styles.portfolioChip,
              selectedPortfolioId === item.id && styles.portfolioChipActive,
            ]}
            onPress={() => setSelectedPortfolioId(item.id)}
            onLongPress={() => confirmDeletePortfolio(item.id, item.name)}
          >
            <Text
              style={[
                styles.portfolioChipText,
                selectedPortfolioId === item.id && styles.portfolioChipTextActive,
              ]}
            >
              {item.name}
            </Text>
            <Text style={styles.portfolioChipCount}>{item.asset_count} ativos</Text>
          </TouchableOpacity>
        )}
      />

      {/* Detalhe do portfólio selecionado */}
      {selectedPortfolioId ? (
        loadingDetail ? (
          <ActivityIndicator color="#818cf8" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.assetSection}>
            <View style={styles.assetHeader}>
              <Text style={styles.assetTitle}>Ativos</Text>
              <TouchableOpacity
                style={styles.addAssetButton}
                onPress={() => setShowAddAsset(true)}
              >
                <Text style={styles.addAssetButtonText}>+ Adicionar</Text>
              </TouchableOpacity>
            </View>

            {selectedPortfolio?.assets.length === 0 ? (
              <View style={styles.emptyAssets}>
                <Text style={styles.emptyAssetsEmoji}>📊</Text>
                <Text style={styles.emptyAssetsText}>
                  Nenhum ativo ainda.{'\n'}Adicione seu primeiro ativo!
                </Text>
              </View>
            ) : (
              <FlatList
                data={selectedPortfolio?.assets}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.assetList}
                renderItem={({ item }) => (
                  <View style={styles.assetCard}>
                    <View style={styles.assetCardLeft}>
                      <Text style={styles.assetTicker}>{item.ticker}</Text>
                      <Text style={styles.assetName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                    <View style={styles.assetCardRight}>
                      <AssetTypeTag type={item.asset_type} />
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => confirmRemoveAsset(item.id, item.ticker)}
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )
      ) : (
        <View style={styles.noSelection}>
          <Text style={styles.noSelectionEmoji}>💼</Text>
          <Text style={styles.noSelectionText}>
            Selecione ou crie um portfólio para ver seus ativos.
          </Text>
        </View>
      )}

      {/* Modal: criar portfólio */}
      <Modal visible={showCreatePortfolio} transparent animationType="slide" onRequestClose={() => setShowCreatePortfolio(false)}>
        <TouchableWithoutFeedback onPress={() => setShowCreatePortfolio(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Novo portfólio</Text>
                  <TouchableOpacity onPress={() => setShowCreatePortfolio(false)} hitSlop={8}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nome do portfólio"
                  placeholderTextColor="#64748b"
                  value={newPortfolioName}
                  onChangeText={setNewPortfolioName}
                />
                <TouchableOpacity
                  style={[styles.modalButton, !newPortfolioName.trim() && styles.buttonDisabled]}
                  disabled={!newPortfolioName.trim() || createPortfolioMutation.isPending}
                  onPress={() => createPortfolioMutation.mutate(newPortfolioName.trim())}
                >
                  {createPortfolioMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Criar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal: adicionar ativo */}
      <Modal visible={showAddAsset} transparent animationType="slide" onRequestClose={() => setShowAddAsset(false)}>
        <TouchableWithoutFeedback onPress={() => setShowAddAsset(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Adicionar ativo</Text>
                  <TouchableOpacity onPress={() => setShowAddAsset(false)} hitSlop={8}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel}>Ticker</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: PETR4, BTC, HGLG11"
                  placeholderTextColor="#64748b"
                  value={assetTicker}
                  onChangeText={setAssetTicker}
                  autoCapitalize="characters"
                />

                <Text style={styles.modalLabel}>Nome</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: Petrobras PN"
                  placeholderTextColor="#64748b"
                  value={assetName}
                  onChangeText={setAssetName}
                />

                <Text style={styles.modalLabel}>Tipo</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.typeSelector}
                >
                  {ASSET_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      style={[
                        styles.typeOption,
                        assetType === t.value && styles.typeOptionActive,
                      ]}
                      onPress={() => setAssetType(t.value)}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          assetType === t.value && styles.typeOptionTextActive,
                        ]}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    (!assetTicker.trim() || !assetName.trim()) && styles.buttonDisabled,
                  ]}
                  disabled={!assetTicker.trim() || !assetName.trim() || addAssetMutation.isPending}
                  onPress={() => addAssetMutation.mutate()}
                >
                  {addAssetMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Adicionar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#f1f5f9' },
  addButton: {
    backgroundColor: '#312e81',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonText: { color: '#818cf8', fontWeight: '600', fontSize: 14 },
  portfolioList: { paddingHorizontal: 20, paddingBottom: 12, gap: 10, alignItems: 'center' },
  portfolioChip: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 120,
    alignSelf: 'flex-start',
  },
  portfolioChipActive: {
    borderColor: '#818cf8',
    backgroundColor: '#1e1b4b',
  },
  portfolioChipText: { color: '#94a3b8', fontWeight: '600', fontSize: 14 },
  portfolioChipTextActive: { color: '#818cf8' },
  portfolioChipCount: { color: '#475569', fontSize: 11, marginTop: 2 },
  emptyText: { color: '#475569', marginTop: 8, fontSize: 14 },
  assetSection: { flex: 1, paddingHorizontal: 20 },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '600' },
  addAssetButton: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addAssetButtonText: { color: '#818cf8', fontSize: 13, fontWeight: '600' },
  assetList: { gap: 8, paddingBottom: 20 },
  assetCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  assetCardLeft: { flex: 1 },
  assetTicker: { color: '#f1f5f9', fontWeight: '700', fontSize: 16 },
  assetName: { color: '#64748b', fontSize: 12, marginTop: 2 },
  assetCardRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#450a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: { color: '#f87171', fontSize: 12, fontWeight: '700' },
  emptyAssets: { alignItems: 'center', marginTop: 60 },
  emptyAssetsEmoji: { fontSize: 48, marginBottom: 12 },
  emptyAssetsText: { color: '#475569', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  noSelection: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  noSelectionEmoji: { fontSize: 48, marginBottom: 12 },
  noSelectionText: { color: '#475569', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: '700' },
  modalClose: { color: '#64748b', fontSize: 18, fontWeight: '600' },
  modalLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 14,
    color: '#f1f5f9',
    fontSize: 15,
    marginBottom: 16,
  },
  typeSelector: { marginBottom: 20 },
  typeOption: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  typeOptionActive: { borderColor: '#818cf8', backgroundColor: '#1e1b4b' },
  typeOptionText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  typeOptionTextActive: { color: '#818cf8' },
  modalButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  modalButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
