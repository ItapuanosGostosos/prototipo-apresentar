import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Image, ScrollView, useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { C, R, shadow } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import { FieldLabel, GlassCard, Input, PrimaryButton } from '../../src/components/ui/primitives';
import { useAuthStore } from '../../src/store/authStore';

const logoSource = require('../../assets/logo.png');

export default function LoginScreen() {
  const { login } = useAuthStore();
  const { height } = useWindowDimensions();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Logo menor em telas baixas (ex.: iPhone SE, teclado aberto) para não empurrar o formulário
  const logoSize = height < 700 ? 72 : 96;

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password.trim()) { setError('Preencha e-mail e senha.'); return; }
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.root}>
      <DecoBackground />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={s.inner}>
            {/* Logo + marca */}
            <Image
              source={logoSource}
              style={[s.logo, { width: logoSize, height: logoSize }]}
              resizeMode="contain"
              accessibilityLabel="Logo Portfolio Tracker"
            />
            <Text style={s.brand}>Portfolio Tracker</Text>
            <Text style={s.brandSub}>Acompanhe seus investimentos</Text>

            <GlassCard style={s.card}>
              {error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

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
                placeholder="Sua senha"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
                style={s.field}
              />

              <PrimaryButton label="Entrar" onPress={handleLogin} loading={loading} style={s.button} />
            </GlassCard>

            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={s.link}>
                <Text style={s.linkText}>
                  Não tem conta? <Text style={s.linkHighlight}>Cadastre-se</Text>
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
  logo: { alignSelf: 'center', marginBottom: 16, borderRadius: R.lg, ...shadow.glow },
  brand: { color: C.text, fontSize: 32, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' },
  brandSub: { color: C.textMuted, fontSize: 15, textAlign: 'center', marginTop: 2, marginBottom: 28 },
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
