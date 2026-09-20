import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { C, R, TAB_BAR_SPACE, shadow } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import { DangerButton, GlassCard, IconBubble, type IconName } from '../../src/components/ui/primitives';
import { useAuthStore } from '../../src/store/authStore';
import { confirmAction } from '../../src/utils/feedback';

const MENU_ITEMS: { id: string; icon: IconName; label: string; hint: string; href: Href }[] = [
  {
    id: 'settings',
    icon: 'person-outline',
    label: 'Configurações de Perfil',
    hint: 'Nome, CPF e senha',
    href: '/profile-settings',
  },
  {
    id: 'notifs',
    icon: 'notifications-outline',
    label: 'Notificações',
    hint: 'Ativar, desativar e testar avisos',
    href: '/notifications-settings',
  },
  {
    id: 'privacy',
    icon: 'shield-checkmark-outline',
    label: 'Política de Privacidade',
    hint: 'Quais dados usamos e por quê',
    href: '/privacy-policy',
  },
  {
    id: 'help',
    icon: 'headset-outline',
    label: 'Ajuda & Suporte',
    hint: 'Perguntas frequentes e contato',
    href: '/help-support',
  },
];

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const username = user?.username || 'Usuário';
  const initial  = username[0]?.toUpperCase() ?? 'U';

  function handleLogout() {
    confirmAction({
      title: 'Sair da conta',
      message: 'Deseja sair da sua conta?',
      confirmLabel: 'Sair',
      destructive: true,
      onConfirm: () => { logout(); },
    });
  }

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={s.inner} showsVerticalScrollIndicator={false}>
          {/* Avatar com anel gradiente (Figma) */}
          <LinearGradient colors={[C.accentLt, C.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatarRing}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
          </LinearGradient>

          <Text style={s.name}>{username}</Text>
          <Text style={s.email}>{user?.email}</Text>

          {/* Menu (linhas translúcidas com ícone e chevron) */}
          <View style={s.menu}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => router.push(item.href)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <GlassCard style={s.menuItem}>
                  <IconBubble name={item.icon} size={38} color={C.textSec} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.menuLabel}>{item.label}</Text>
                    <Text style={s.menuHint}>{item.hint}</Text>
                  </View>
                  <Ionicons name="chevron-forward" color={C.textMuted} size={18} />
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>

          <DangerButton label="Sair da conta" onPress={handleLogout} style={s.logout} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  inner: {
    alignItems: 'center', paddingTop: 36, paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE,
    width: '100%', maxWidth: 520, alignSelf: 'center',
  },

  avatarRing: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...shadow.glow },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: C.bgSolid, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.text, fontSize: 38, fontWeight: '700' },

  name: { color: C.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.3, marginBottom: 2, textAlign: 'center' },
  email: { color: C.textMuted, fontSize: 14, marginBottom: 28, textAlign: 'center' },

  menu: { width: '100%', gap: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: R.lg },
  menuLabel: { color: C.text, fontSize: 15, fontWeight: '500' },
  menuHint: { color: C.textMuted, fontSize: 12, marginTop: 2 },

  logout: { alignSelf: 'center', minWidth: 200, marginTop: 28 },
});
