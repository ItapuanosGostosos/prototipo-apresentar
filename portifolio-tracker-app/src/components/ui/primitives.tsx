import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { C, R, shadow } from '../../theme';

export type IconName = keyof typeof Ionicons.glyphMap;

// ─── Glass card ──────────────────────────────────────────────────────────────

export function GlassCard({ children, style, strong = false }: {
  children: ReactNode; style?: StyleProp<ViewStyle>; strong?: boolean;
}) {
  return <View style={[st.glass, strong && st.glassStrong, style]}>{children}</View>;
}

// ─── Chip (pílula) ───────────────────────────────────────────────────────────

export function Chip({ label, active = false, onPress, onLongPress, icon, count, style }: {
  label: string; active?: boolean; onPress?: () => void; onLongPress?: () => void;
  icon?: IconName; count?: number; style?: StyleProp<ViewStyle>;
}) {
  const fg = active ? C.textOnLight : C.textSec;
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={[st.chip, active && st.chipActive, style]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {icon ? <Ionicons name={icon} size={14} color={fg} style={{ marginRight: 6 }} /> : null}
      <Text style={[st.chipText, active && st.chipTextActive]}>{label}</Text>
      {count !== undefined ? (
        <View style={[st.chipCount, active && st.chipCountActive]}>
          <Text style={[st.chipCountText, active && st.chipCountTextActive]}>{count}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Botões ──────────────────────────────────────────────────────────────────

export function PrimaryButton({ label, onPress, loading = false, disabled = false, icon, style }: {
  label: string; onPress: () => void; loading?: boolean; disabled?: boolean; icon?: IconName; style?: StyleProp<ViewStyle>;
}) {
  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.85}
      style={[st.primaryWrap, inactive && st.disabled, style]}
      accessibilityRole="button"
    >
      <LinearGradient
        colors={[C.accentLt, C.accent, C.accentDk]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={st.primary}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={18} color="#fff" style={{ marginRight: 8 }} /> : null}
            <Text style={st.primaryText}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

/** Botão discreto em pílula translúcida (ações secundárias no header). */
export function GhostButton({ label, onPress, icon, loading = false, disabled = false, style }: {
  label: string; onPress: () => void; icon?: IconName; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[st.ghost, (disabled || loading) && st.disabled, style]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color={C.text} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={16} color={C.text} style={{ marginRight: 6 }} /> : null}
          <Text style={st.ghostText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function DangerButton({ label, onPress, icon = 'log-out-outline', style }: {
  label: string; onPress: () => void; icon?: IconName; style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[st.danger, style]} accessibilityRole="button">
      <Ionicons name={icon} size={18} color="#fff" style={{ marginRight: 8 }} />
      <Text style={st.dangerText}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Botão largo com borda tracejada ("+") usado para adicionar itens, como no Figma. */
export function DashedAddButton({ label, onPress, style }: {
  label?: string; onPress: () => void; style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[st.dashed, style]} accessibilityRole="button">
      <Ionicons name="add" size={22} color={C.text} />
      {label ? <Text style={st.dashedText}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

export function Input({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={C.textMuted}
      selectionColor={C.accentLt}
      {...props}
      style={[st.input, style]}
    />
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={st.fieldLabel}>{children}</Text>;
}

// ─── Ícone circular ──────────────────────────────────────────────────────────

export function IconBubble({ name, size = 40, color = C.text, bg, active = false }: {
  name: IconName; size?: number; color?: string; bg?: string; active?: boolean;
}) {
  return (
    <View
      style={[
        st.bubble,
        { width: size, height: size, borderRadius: size / 2 },
        bg ? { backgroundColor: bg } : null,
        active && st.bubbleActive,
      ]}
    >
      <Ionicons name={name} size={Math.round(size * 0.5)} color={color} />
    </View>
  );
}

// ─── Estado vazio ────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description }: {
  icon: IconName; title: string; description?: string;
}) {
  return (
    <View style={st.empty}>
      <IconBubble name={icon} size={64} color={C.textSec} />
      <Text style={st.emptyTitle}>{title}</Text>
      {description ? <Text style={st.emptyText}>{description}</Text> : null}
    </View>
  );
}

// ─── Cabeçalho de tela ───────────────────────────────────────────────────────

export function ScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={st.header}>
      <View style={{ flex: 1 }}>
        <Text style={st.headerTitle}>{title}</Text>
        {subtitle ? <Text style={st.headerSub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/** Cabeçalho das telas empilhadas (fora das abas): voltar + título centralizado. */
export function BackHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View style={st.backHeader}>
      <TouchableOpacity
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
        hitSlop={8}
        accessibilityLabel="Voltar"
        accessibilityRole="button"
      >
        <IconBubble name="arrow-back" size={40} />
      </TouchableOpacity>
      <Text style={st.backHeaderTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const st = StyleSheet.create({
  glass: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border, borderRadius: R.lg },
  glassStrong: { backgroundColor: C.bgCardLt, borderColor: C.borderLt },

  chip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 36,
    borderRadius: R.pill, backgroundColor: C.bgCardLt, borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  chipText: { color: C.textSec, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: C.textOnLight },
  chipCount: {
    marginLeft: 8, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  chipCountActive: { backgroundColor: C.accentSoft },
  chipCountText: { color: C.textSec, fontSize: 11, fontWeight: '700' },
  chipCountTextActive: { color: C.accentDk },

  primaryWrap: { borderRadius: R.lg, overflow: 'hidden', ...shadow.glow },
  primary: { height: 52, borderRadius: R.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  disabled: { opacity: 0.5 },

  ghost: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 38, minWidth: 38, paddingHorizontal: 14,
    borderRadius: R.pill, backgroundColor: C.bgCardLt, borderWidth: 1, borderColor: C.border,
  },
  ghostText: { color: C.text, fontSize: 13, fontWeight: '600' },

  danger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 46, paddingHorizontal: 22,
    borderRadius: R.md, backgroundColor: C.danger,
    shadowColor: C.danger, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  dangerText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  dashed: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, gap: 6,
    borderRadius: R.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  dashedText: { color: C.text, fontSize: 14, fontWeight: '600' },

  input: {
    height: 52, paddingHorizontal: 16, borderRadius: R.md,
    backgroundColor: C.bgInput, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 15,
  },
  fieldLabel: {
    color: C.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6,
  },

  bubble: {
    backgroundColor: C.bgCardLt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center',
  },
  bubbleActive: { backgroundColor: C.accent, borderColor: C.accentLt },

  empty: { alignItems: 'center', paddingHorizontal: 32, gap: 10 },
  emptyTitle: { color: C.text, fontSize: 18, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  emptyText: { color: C.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 21 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { color: C.text, fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { color: C.textMuted, fontSize: 12, marginTop: 2 },

  backHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backHeaderTitle: { color: C.text, fontSize: 18, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
});
