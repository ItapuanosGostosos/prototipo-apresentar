import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>📈</Text>
        <Text style={styles.title}>Portfólio Tracker</Text>
        <Text style={styles.subtitle}>Acompanhe seus investimentos</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#64748b"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#64748b"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>
              Não tem conta?{' '}
              <Text style={styles.linkHighlight}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: { fontSize: 56, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#f1f5f9', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 32 },
  errorBox: {
    backgroundColor: '#450a0a',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#f87171', fontSize: 13 },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    color: '#f1f5f9',
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkButton: { alignItems: 'center' },
  linkText: { color: '#94a3b8', fontSize: 14 },
  linkHighlight: { color: '#818cf8', fontWeight: '600' },
});
