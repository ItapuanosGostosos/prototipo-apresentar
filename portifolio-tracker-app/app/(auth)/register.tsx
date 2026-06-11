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
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function RegisterScreen() {
  const { register } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    setError('');
    if (!email.trim() || !username.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Comece a rastrear seu portfólio</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Nome de usuário</Text>
        <TextInput
          style={styles.input}
          placeholder="seu_nome"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="voce@email.com"
          placeholderTextColor="#64748b"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 8 caracteres"
          placeholderTextColor="#64748b"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Criar conta</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>
              Já tem conta?{' '}
              <Text style={styles.linkHighlight}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 24 },
  errorBox: {
    backgroundColor: '#450a0a',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#f87171', fontSize: 13 },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    color: '#f1f5f9',
    fontSize: 15,
    marginBottom: 16,
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
