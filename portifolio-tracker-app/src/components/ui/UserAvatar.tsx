import { Text, StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { C, shadow } from '../../theme';
import { useAuthStore } from '../../store/authStore';

/** Nome exibido do usuário logado (username, senão o começo do e-mail). */
export function useDisplayName(): string {
  const user = useAuthStore((st) => st.user);
  return user?.username || user?.email?.split('@')[0] || 'Usuário';
}

/**
 * Avatar do usuário com anel gradiente (Figma). É um botão: em qualquer tela,
 * tocar no avatar leva para a aba de Perfil.
 */
export function UserAvatar({ size = 50, style }: { size?: number; style?: StyleProp<ViewStyle> }) {
  const router = useRouter();
  const name = useDisplayName();
  const inner = size - 6;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => router.push('/(tabs)/profile')}
      accessibilityRole="button"
      accessibilityLabel="Abrir perfil"
      hitSlop={6}
      style={style}
    >
      <LinearGradient
        colors={[C.accentLt, C.pink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.ring, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <View style={[s.inner, { width: inner, height: inner, borderRadius: inner / 2 }]}>
          <Text style={[s.initial, { fontSize: Math.round(size * 0.38) }]}>
            {name[0]?.toUpperCase() ?? 'U'}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  ring: { alignItems: 'center', justifyContent: 'center', ...shadow.glow },
  inner: { backgroundColor: C.bgSolid, alignItems: 'center', justifyContent: 'center' },
  initial: { color: C.text, fontWeight: '700' },
});
