import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { C } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import { useAuthStore } from '../../src/store/authStore';

const MENU_ITEMS = [
  { id: 'settings',   icon: 'person-circle-outline', label: 'Configurações de Perfil' },
  { id: 'notifs',     icon: 'notifications-outline',  label: 'Notificações' },
  { id: 'privacy',    icon: 'shield-checkmark-outline',label: 'Política de Privacidade' },
  { id: 'help',       icon: 'help-circle-outline',    label: 'Ajuda & Suporte' },
] as const;

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const username = user?.username || 'Usuário';
  const initial  = username[0]?.toUpperCase() ?? 'U';

  function handleLogout() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.inner}>
          {/* Avatar */}
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <View style={s.avatarBadge}>
              <Ionicons name="checkmark" color="#fff" size={10} />
            </View>
          </View>

          <Text style={s.name}>{username}</Text>
          <Text style={s.email}>{user?.email}</Text>

          {/* Menu */}
          <View style={s.menu}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={s.menuItem}
                onPress={item.id === 'settings' ? () => router.push('/profile-settings') : undefined}
              >
                <View style={s.menuIconWrap}>
                  <Ionicons name={item.icon as any} color={C.accentLt} size={18} />
                </View>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" color={C.textMuted} size={16} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" color="#f87171" size={18} />
            <Text style={s.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },

  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.accentDk, borderWidth: 3, borderColor: C.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: C.accentLt, fontSize: 36, fontWeight: '700' },
  avatarBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#059669', borderWidth: 2, borderColor: C.bg,
    justifyContent: 'center', alignItems: 'center',
  },

  name: { color: C.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  email: { color: C.textMuted, fontSize: 14, marginBottom: 36 },

  menu: { width: '100%', gap: 6 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.accentDk, justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { color: C.text, fontSize: 15, flex: 1 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 32, backgroundColor: '#2d0707', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32,
    borderWidth: 1, borderColor: '#7f1d1d',
  },
  logoutText: { color: '#f87171', fontWeight: '600', fontSize: 15 },
});
