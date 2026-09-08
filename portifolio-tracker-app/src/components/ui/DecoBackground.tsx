import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { C } from '../../theme';

/**
 * Fundo padrão das telas (Figma): gradiente escuro → violeta com as linhas de
 * gráfico decorativas (rosa e azul). Absoluto e não interativo; coloque como
 * primeiro filho do container da tela.
 */
export function DecoBackground({ waves = true, intensity = 1 }: { waves?: boolean; intensity?: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[C.bg, C.bgMid, C.bgBottom]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="100%" r="70%">
            <Stop offset="0" stopColor={C.accentLt} stopOpacity={0.35 * intensity} />
            <Stop offset="1" stopColor={C.accentLt} stopOpacity={0} />
          </RadialGradient>
          <SvgGradient id="pink" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={C.pink} stopOpacity={0} />
            <Stop offset="0.3" stopColor={C.pink} stopOpacity={0.9} />
            <Stop offset="1" stopColor={C.pink} stopOpacity={0.15} />
          </SvgGradient>
          <SvgGradient id="blue" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={C.blue} stopOpacity={0.15} />
            <Stop offset="0.6" stopColor={C.blue} stopOpacity={0.9} />
            <Stop offset="1" stopColor={C.blue} stopOpacity={0} />
          </SvgGradient>
        </Defs>
        <Rect x="0" y="0" width="390" height="844" fill="url(#glow)" />
        {waves ? (
          <>
            <Path
              d="M-20 520 C 60 470, 110 600, 180 540 S 300 380, 420 430"
              stroke="url(#pink)" strokeWidth={2.2} fill="none" opacity={0.75 * intensity}
            />
            <Path
              d="M-20 600 C 70 640, 120 470, 210 520 S 320 660, 420 560"
              stroke="url(#blue)" strokeWidth={2.2} fill="none" opacity={0.75 * intensity}
            />
            <Path
              d="M-20 160 C 50 120, 90 230, 170 190 S 280 90, 420 150"
              stroke="url(#blue)" strokeWidth={1.6} fill="none" opacity={0.35 * intensity}
            />
          </>
        ) : null}
      </Svg>
    </View>
  );
}
