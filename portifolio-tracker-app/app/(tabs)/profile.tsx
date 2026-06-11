import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  function handleLogout() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.username?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{user?.username || 'Usuário'}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#312e81',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { color: '#818cf8', fontSize: 32, fontWeight: '700' },
  name: { color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  email: { color: '#64748b', fontSize: 14, marginBottom: 32 },
  divider: { width: '100%', height: 1, backgroundColor: '#1e293b', marginBottom: 24 },
  logoutButton: {
    backgroundColor: '#450a0a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  logoutText: { color: '#f87171', fontWeight: '600', fontSize: 15 },
});
