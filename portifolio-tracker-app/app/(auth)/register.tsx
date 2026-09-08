import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image, useWindowDimensions,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { C, R, shadow } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import { FieldLabel, GlassCard, Input, PrimaryButton } from '../../src/components/ui/primitives';
import { useAuthStore } from '../../src/store/authStore';

const logoSource = require('../../assets/logo.png');

export default function RegisterScreen() {
  const { register } = useAuthStore();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [email, setEmail]       = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const logoSize = height < 700 ? 56 : 72;

  async function handleRegister() {
    setError('');
    if (!email.trim() || !username.trim() || !password.trim()) { setError('Preencha todos os campos.'); return; }
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return; }
    setSubmitting(true);
    try {
      await register({ email: email.trim(), username: username.trim(), password });
      router.replace('/(auth)/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={s.root}>
      <DecoBackground />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={s.inner}>
            <Image
              source={logoSource}
              style={[s.logo, { width: logoSize, height: logoSize }]}
              resizeMode="contain"
              accessibilityLabel="Logo Portfolio Tracker"
            />
            <Text style={s.title}>Criar conta</Text>
            <Text style={s.subtitle}>Comece a acompanhar seu portfólio</Text>

            <GlassCard style={s.card}>
              {error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <FieldLabel>Nome de usuário</FieldLabel>
              <Input placeholder="seu_nome" autoCapitalize="none" value={username} onChangeText={setUsername} style={s.field} />

              <FieldLabel>E-mail</FieldLabel>
              <Input
                placeholder="voce@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                style={s.field}
              />

              <FieldLabel>Senha</FieldLabel>
              <Input
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleRegister}
                returnKeyType="go"
                style={s.field}
              />

              <PrimaryButton label="Criar conta" onPress={handleRegister} loading={submitting} style={s.button} />
            </GlassCard>

            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={s.link}>
                <Text style={s.linkText}>
                  Já tem conta? <Text style={s.linkHighlight}>Entrar</Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  inner: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  logo: { alignSelf: 'center', marginBottom: 16, borderRadius: R.md, ...shadow.glow },
  title: { color: C.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { color: C.textMuted, fontSize: 15, textAlign: 'center', marginTop: 2, marginBottom: 28 },
  card: { padding: 20, borderRadius: R.xl },
  field: { marginBottom: 16 },
  button: { marginTop: 4 },
  errorBox: {
    backgroundColor: C.dangerSoft, borderWidth: 1, borderColor: 'rgba(255,75,75,0.4)',
    borderRadius: R.sm, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#FF8A8A', fontSize: 13 },
  link: { alignItems: 'center', marginTop: 20 },
  linkText: { color: C.textSec, fontSize: 14 },
  linkHighlight: { color: C.accentLt, fontWeight: '600' },
});
