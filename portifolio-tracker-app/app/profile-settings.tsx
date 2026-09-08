import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../src/theme';
import { DecoBackground } from '../src/components/ui/DecoBackground';
import { BackHeader, FieldLabel, GlassCard, Input, Notice, PrimaryButton } from '../src/components/ui/primitives';
import { useAuthStore } from '../src/store/authStore';
import { changePassword } from '../src/services/auth';
import { formatCpf, isValidCpf } from '../src/utils/cpf';

type Feedback = { kind: 'success' | 'error'; text: string } | null;

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const [username, setUsername] = useState(user?.username ?? '');
  const [cpf, setCpf]           = useState(formatCpf(user?.cpf ?? ''));
  const [saving, setSaving]     = useState(false);
  const [profileMsg, setProfileMsg] = useState<Feedback>(null);

  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg]           = useState<Feedback>(null);

  useEffect(() => {
    setUsername(user?.username ?? '');
    setCpf(formatCpf(user?.cpf ?? ''));
  }, [user]);

  const cpfDigits = cpf.replace(/\D/g, '');
  const cpfValid = isValidCpf(cpf);
  const cpfIncomplete = cpfDigits.length > 0 && cpfDigits.length < 11;
  const profileDirty = username.trim() !== (user?.username ?? '') || cpf !== formatCpf(user?.cpf ?? '');
  const canSave = profileDirty && username.trim().length > 0 && cpfValid && !cpfIncomplete;

  async function handleSaveProfile() {
    setProfileMsg(null);
    const trimmed = username.trim();
    if (!trimmed) { setProfileMsg({ kind: 'error', text: 'O nome de usuário não pode estar vazio.' }); return; }
    if (!cpfValid || cpfIncomplete) { setProfileMsg({ kind: 'error', text: 'CPF inválido. Confira os 11 dígitos.' }); return; }
    setSaving(true);
    try {
      await updateUser({ username: trimmed, cpf });
      setProfileMsg({ kind: 'success', text: 'Perfil atualizado com sucesso.' });
    } catch (err: unknown) {
      setProfileMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Não foi possível salvar.' });
    } finally {
      setSaving(false);
    }
  }

  const pwMismatch = confirmPw.length > 0 && newPw !== confirmPw;

  async function handleChangePassword() {
    setPwMsg(null);
    if (!currentPw || !newPw || !confirmPw) { setPwMsg({ kind: 'error', text: 'Preencha todos os campos de senha.' }); return; }
    if (newPw !== confirmPw) { setPwMsg({ kind: 'error', text: 'A nova senha e a confirmação não coincidem.' }); return; }
    if (newPw.length < 6) { setPwMsg({ kind: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' }); return; }
    setChangingPw(true);
    try {
      await changePassword({ current_password: currentPw, new_password: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwMsg({ kind: 'success', text: 'Senha alterada com sucesso.' });
    } catch (err: unknown) {
      setPwMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Não foi possível alterar a senha.' });
    } finally {
      setChangingPw(false);
    }
  }

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <BackHeader title="Configurações de Perfil" onBack={() => router.back()} />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Informações pessoais */}
            <GlassCard style={s.section}>
              <Text style={s.sectionTitle}>Informações Pessoais</Text>
              <Text style={s.sectionHint}>Esses dados aparecem no seu perfil e podem ser alterados quando quiser.</Text>

              <FieldLabel>Nome de usuário</FieldLabel>
              <Input placeholder="seu_nome" autoCapitalize="none" value={username} onChangeText={setUsername} style={s.field} maxLength={150} />

              <FieldLabel>CPF (opcional)</FieldLabel>
              <Input
                placeholder="000.000.000-00"
                keyboardType="numeric"
                value={cpf}
                onChangeText={(v) => setCpf(formatCpf(v))}
                style={[s.field, cpfDigits.length === 11 && !cpfValid && s.inputError]}
                maxLength={14}
              />
              {cpfDigits.length === 11 && !cpfValid ? <Text style={s.errorHint}>CPF inválido</Text> : null}

              <FieldLabel>E-mail</FieldLabel>
              <View style={s.inputReadOnly}>
                <Text style={s.inputReadOnlyText}>{user?.email}</Text>
                <Ionicons name="lock-closed-outline" color={C.textMuted} size={14} />
              </View>
              <Text style={s.readOnlyHint}>O e-mail identifica sua conta e não pode ser alterado pelo app.</Text>

              {profileMsg ? <View style={s.notice}><Notice kind={profileMsg.kind}>{profileMsg.text}</Notice></View> : null}

              <PrimaryButton
                label="Salvar alterações"
                onPress={handleSaveProfile}
                disabled={!canSave}
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
                onSubmitEditing={handleChangePassword}
                style={[s.field, pwMismatch && s.inputError]}
              />
              {pwMismatch ? <Text style={s.errorHint}>As senhas não coincidem</Text> : null}

              {pwMsg ? <View style={s.notice}><Notice kind={pwMsg.kind}>{pwMsg.text}</Notice></View> : null}

              <PrimaryButton
                label="Alterar senha"
                onPress={handleChangePassword}
                loading={changingPw}
                disabled={!currentPw || !newPw || !confirmPw || pwMismatch}
                style={s.button}
              />
            </GlassCard>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 20, width: '100%', maxWidth: 560, alignSelf: 'center' },

  section: { padding: 18, borderRadius: R.xl },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  sectionHint: { color: C.textMuted, fontSize: 12, lineHeight: 17, marginBottom: 14 },
  field: { marginBottom: 14 },
  inputError: { borderColor: C.danger },
  errorHint: { color: '#FF8A8A', fontSize: 12, marginTop: -8, marginBottom: 10 },

  inputReadOnly: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 52, paddingHorizontal: 16, borderRadius: R.md,
    backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, opacity: 0.7,
  },
  inputReadOnlyText: { color: C.textMuted, fontSize: 15 },
  readOnlyHint: { color: C.textMuted, fontSize: 11, marginTop: 6, marginBottom: 14 },

  notice: { marginBottom: 12 },
  button: { marginTop: 4 },
});
