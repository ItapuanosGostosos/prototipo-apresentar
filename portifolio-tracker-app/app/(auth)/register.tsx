import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image, useWindowDimensions,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { C } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
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

  const logoSize = height < 700 ? 64 : 80;

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
            {/* Logo */}
            <View style={s.logoWrap}>
              <Image
                source={logoSource}
                style={[s.logo, { width: logoSize, height: logoSize }]}
                resizeMode="contain"
                accessibilityLabel="Logo Portfolio Tracker"
              />
              <Text style={s.appName}>Portfolio Tracker</Text>
              <Text style={s.appSub}>Crie sua conta</Text>
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
                placeholder="Nome de usuário"
                placeholderTextColor={C.textMuted}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
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
                placeholder="Senha (mínimo 8 caracteres)"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleRegister}
                returnKeyType="go"
              />
              <TouchableOpacity
                style={[s.btn, submitting && { opacity: 0.6 }]}
                onPress={handleRegister}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnText}>Criar conta</Text>
                }
              </TouchableOpacity>
            </View>

            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={s.link}>
                <Text style={s.linkText}>
                  Já tem conta?{'  '}
                  <Text style={s.linkHighlight}>Entrar</Text>
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

  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logo: { borderRadius: 20, marginBottom: 14 },
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
