import { View, StyleSheet } from 'react-native';

export function DecoBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[s.blob, { backgroundColor: '#4c1d95', width: 320, height: 320, top: -100, left: -80 }]} />
      <View style={[s.blob, { backgroundColor: '#7c3aed', width: 160, height: 160, top: 140, left: 80, opacity: 0.15 }]} />
      <View style={[s.blob, { backgroundColor: '#9d174d', width: 260, height: 260, bottom: -80, right: -70 }]} />
      <View style={[s.blob, { backgroundColor: '#6d28d9', width: 140, height: 140, top: '42%', right: -40, opacity: 0.2 }]} />
    </View>
  );
}

const s = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.35,
  },
});
