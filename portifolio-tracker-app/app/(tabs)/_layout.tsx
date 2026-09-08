import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, shadow } from '../../src/theme';

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Ícone da tab bar flutuante (Figma): o item ativo vira um círculo índigo
 * elevado acima da barra; os inativos ficam em cinza, sem rótulo.
 */
function TabIcon({ focused, outline, filled }: { focused: boolean; outline: IconName; filled: IconName }) {
  return (
    <View style={[s.icon, focused && s.iconActive]}>
      <Ionicons name={focused ? filled : outline} size={22} color={focused ? '#fff' : C.tabInactive} />
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Em telas largas (web/tablet) a barra não ocupa a largura toda: no máximo 560px, centralizada.
  const barWidth = Math.min(width - 32, 560);
  const barLeft = Math.round((width - barWidth) / 2);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: C.bg },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: C.tabInactive,
        tabBarStyle: {
          position: 'absolute',
          left: barLeft,
          width: barWidth,
          bottom: Math.max(insets.bottom, 12),
          height: 64,
          borderRadius: 32,
          backgroundColor: C.tabBar,
          borderTopWidth: 0,
          overflow: 'visible',
          ...shadow.soft,
        },
        tabBarItemStyle: { height: 64, justifyContent: 'center' },
        tabBarIconStyle: { width: 56, height: 56 },
      }}
    >
      {/* Ordem das abas segue o Figma: notícias, carteira, home, analytics, perfil */}
      <Tabs.Screen
        name="news"
        options={{
          title: 'Notícias',
          tabBarAccessibilityLabel: 'Notícias',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} outline="newspaper-outline" filled="newspaper" />,
        }}
      />
      <Tabs.Screen
        name="portfolios"
        options={{
          title: 'Carteira',
          tabBarAccessibilityLabel: 'Carteira',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} outline="wallet-outline" filled="wallet" />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Início',
          tabBarAccessibilityLabel: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} outline="home-outline" filled="home" />,
        }}
      />
      <Tabs.Screen
        name="analyses"
        options={{
          title: 'Análises',
          tabBarAccessibilityLabel: 'Análises',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} outline="pie-chart-outline" filled="pie-chart" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarAccessibilityLabel: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} outline="person-outline" filled="person" />,
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  iconActive: {
    backgroundColor: C.accent,
    borderWidth: 3,
    borderColor: C.tabBar,
    transform: [{ translateY: -14 }],
    ...shadow.glow,
  },
});
