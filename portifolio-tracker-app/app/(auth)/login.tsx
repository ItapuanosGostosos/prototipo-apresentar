import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, ScrollView, useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { C } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
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
            {/* Logo */}
            <View style={s.logoWrap}>
              <Image
                source={logoSource}
                style={[s.logo, { width: logoSize, height: logoSize }]}
                resizeMode="contain"
                accessibilityLabel="Logo Portfolio Tracker"
              />
              <Text style={s.appName}>Portfolio Tracker</Text>
              <Text style={s.appSub}>Acompanhe seus investimentos</Text>
            </View>

            {/* Error */}
            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={s.form}>
              <TextInput
                style={s.input}
                placeholder="E-mail"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <TextInput
                style={s.input}
                placeholder="Senha"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
              <TouchableOpacity
                style={[s.btn, loading && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnText}>Entrar</Text>
                }
              </TouchableOpacity>
            </View>

            <Link href="/(auth)/register" asChild>
              <TouchableOpacity style={s.link}>
                <Text style={s.linkText}>
                  Não tem conta?{'  '}
                  <Text style={s.linkHighlight}>Cadastre-se</Text>
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
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 32 },
  inner: { width: '100%', maxWidth: 440, alignSelf: 'center' },

  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logo: { borderRadius: 22, marginBottom: 14 },
  appName: { color: C.text, fontSize: 28, fontWeight: '800', letterSpacing: 0.5 },
  appSub: { color: C.textMuted, fontSize: 13, marginTop: 4 },

  errorBox: {
    backgroundColor: '#2d0707', borderWidth: 1, borderColor: '#7f1d1d',
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#f87171', fontSize: 13 },

  form: { gap: 12, marginBottom: 20 },
  input: {
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border,
    borderRadius: 14, padding: 16, color: C.text, fontSize: 15,
  },
  btn: {
    backgroundColor: C.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  link: { alignItems: 'center', marginTop: 8 },
  linkText: { color: C.textMuted, fontSize: 14 },
  linkHighlight: { color: C.accentLt, fontWeight: '600' },
});
