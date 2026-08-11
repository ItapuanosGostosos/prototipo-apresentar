import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../src/theme';
import { DecoBackground } from '../src/components/ui/DecoBackground';
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

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" color={C.text} size={22} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Configurações de Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Profile info */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Informações Pessoais</Text>

              <Text style={s.label}>Nome de usuário</Text>
              <TextInput
                style={s.input}
                placeholder="seu_nome"
                placeholderTextColor={C.textMuted}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />

              <Text style={s.label}>CPF</Text>
              <TextInput
                style={s.input}
                placeholder="000.000.000-00"
                placeholderTextColor={C.textMuted}
                keyboardType="numeric"
                value={cpf}
                onChangeText={setCpf}
              />

              <Text style={s.label}>E-mail</Text>
              <View style={s.inputReadOnly}>
                <Text style={s.inputReadOnlyText}>{user?.email}</Text>
                <Ionicons name="lock-closed-outline" color={C.textMuted} size={14} />
              </View>

              <TouchableOpacity
                style={[s.btn, (!profileDirty || saving) && s.btnDisabled]}
                onPress={handleSaveProfile}
                disabled={!profileDirty || saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.btnText}>Salvar alterações</Text>
                }
              </TouchableOpacity>
            </View>

            {/* Change password */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Alterar Senha</Text>

              <Text style={s.label}>Senha atual</Text>
              <TextInput
                style={s.input}
                placeholder="••••••••"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                value={currentPw}
                onChangeText={setCurrentPw}
              />

              <Text style={s.label}>Nova senha</Text>
              <TextInput
                style={s.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                value={newPw}
                onChangeText={setNewPw}
              />

              <Text style={s.label}>Confirmar nova senha</Text>
              <TextInput
                style={[s.input, confirmPw.length > 0 && newPw !== confirmPw && s.inputError]}
                placeholder="Repita a nova senha"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                value={confirmPw}
                onChangeText={setConfirmPw}
              />
              {confirmPw.length > 0 && newPw !== confirmPw && (
                <Text style={s.errorHint}>As senhas não coincidem</Text>
              )}

              <TouchableOpacity
                style={[s.btn, changingPw && s.btnDisabled]}
                onPress={handleChangePassword}
                disabled={changingPw}
              >
                {changingPw
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.btnText}>Alterar senha</Text>
                }
              </TouchableOpacity>
            </View>

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
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '700' },

  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 24 },

  section: {
    backgroundColor: C.bgCard, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: C.border, gap: 8,
  },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },

  label: { color: C.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },

  input: {
    backgroundColor: C.bgCardLt, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 14, color: C.text, fontSize: 15,
  },
  inputError: { borderColor: C.danger },
  errorHint: { color: C.danger, fontSize: 12, marginTop: -4 },

  inputReadOnly: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.bgCardLt, borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 14, opacity: 0.6,
  },
  inputReadOnlyText: { color: C.textMuted, fontSize: 15 },

  btn: {
    backgroundColor: C.accent, borderRadius: 12, padding: 15,
    alignItems: 'center', marginTop: 6,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
