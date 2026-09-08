import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../src/theme';
import { DecoBackground } from '../src/components/ui/DecoBackground';
import { FieldLabel, GlassCard, IconBubble, Input, PrimaryButton } from '../src/components/ui/primitives';
import { useAuthStore } from '../src/store/authStore';
import { changePassword } from '../src/services/auth';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [username, setUsername] = useState(user?.username ?? '');
  const [cpf, setCpf]           = useState(user?.cpf ?? '');
  const [saving, setSaving]     = useState(false);

  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    setUsername(user?.username ?? '');
    setCpf(user?.cpf ?? '');
  }, [user]);

  async function handleSaveProfile() {
    const trimmed = username.trim();
    if (!trimmed) { Alert.alert('Erro', 'O nome de usuário não pode estar vazio.'); return; }
    setSaving(true);
    try {
      await updateUser({ username: trimmed, cpf: cpf.trim() });
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
    } catch (err: unknown) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) { Alert.alert('Erro', 'Preencha todos os campos de senha.'); return; }
    if (newPw !== confirmPw) { Alert.alert('Erro', 'A nova senha e a confirmação não coincidem.'); return; }
    if (newPw.length < 6) { Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.'); return; }
    setChangingPw(true);
    try {
      await changePassword({ current_password: currentPw, new_password: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      Alert.alert('Sucesso', 'Senha alterada com sucesso.');
    } catch (err: unknown) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível alterar a senha.');
    } finally {
      setChangingPw(false);
    }
  }

  const profileDirty = username.trim() !== (user?.username ?? '') || cpf.trim() !== (user?.cpf ?? '');
  const pwMismatch = confirmPw.length > 0 && newPw !== confirmPw;

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} accessibilityLabel="Voltar">
            <IconBubble name="arrow-back" size={40} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Configurações de Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Informações pessoais */}
            <GlassCard style={s.section}>
              <Text style={s.sectionTitle}>Informações Pessoais</Text>

              <FieldLabel>Nome de usuário</FieldLabel>
              <Input placeholder="seu_nome" autoCapitalize="none" value={username} onChangeText={setUsername} style={s.field} />

              <FieldLabel>CPF</FieldLabel>
              <Input placeholder="000.000.000-00" keyboardType="numeric" value={cpf} onChangeText={setCpf} style={s.field} />

              <FieldLabel>E-mail</FieldLabel>
              <View style={s.inputReadOnly}>
                <Text style={s.inputReadOnlyText}>{user?.email}</Text>
                <Ionicons name="lock-closed-outline" color={C.textMuted} size={14} />
              </View>

              <PrimaryButton
                label="Salvar alterações"
                onPress={handleSaveProfile}
                disabled={!profileDirty}
                loading={saving}
                style={s.button}
              />
            </GlassCard>

            {/* Alterar senha */}
            <GlassCard style={s.section}>
              <Text style={s.sectionTitle}>Alterar Senha</Text>

              <FieldLabel>Senha atual</FieldLabel>
              <Input placeholder="••••••••" secureTextEntry value={currentPw} onChangeText={setCurrentPw} style={s.field} />

              <FieldLabel>Nova senha</FieldLabel>
              <Input placeholder="Mínimo 6 caracteres" secureTextEntry value={newPw} onChangeText={setNewPw} style={s.field} />

              <FieldLabel>Confirmar nova senha</FieldLabel>
              <Input
                placeholder="Repita a nova senha"
                secureTextEntry
                value={confirmPw}
                onChangeText={setConfirmPw}
                style={[s.field, pwMismatch && s.inputError]}
              />
              {pwMismatch && <Text style={s.errorHint}>As senhas não coincidem</Text>}

              <PrimaryButton label="Alterar senha" onPress={handleChangePassword} loading={changingPw} style={s.button} />
            </GlassCard>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '700' },

  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 20, width: '100%', maxWidth: 560, alignSelf: 'center' },

  section: { padding: 18, borderRadius: R.xl },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  field: { marginBottom: 14 },
  inputError: { borderColor: C.danger },
  errorHint: { color: '#FF8A8A', fontSize: 12, marginTop: -8, marginBottom: 10 },

  inputReadOnly: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 52, paddingHorizontal: 16, borderRadius: R.md,
    backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, opacity: 0.7, marginBottom: 14,
  },
  inputReadOnlyText: { color: C.textMuted, fontSize: 15 },

  button: { marginTop: 4 },
});
