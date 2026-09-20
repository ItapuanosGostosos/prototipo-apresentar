/**
 * Tema visual baseado no Figma "TrendLens UI" (marca exibida: Portfolio Tracker).
 * Fundo quase preto com gradiente violeta, superfícies translúcidas ("glass"),
 * acento índigo-violeta, chips em pílula e tab bar flutuante.
 *
 * As chaves de `C` são as mesmas usadas pelas telas desde o primeiro redesign;
 * só os valores mudaram, então o tema novo se propaga sem reescrever cada estilo.
 */
export const C = {
  // Fundo (o gradiente vai de bg → bgMid → bgBottom, ver DecoBackground)
  bg:        '#0A0714',
  bgMid:     '#140D2E',
  bgBottom:  '#2B1B6E',

  // Superfícies translúcidas sobre o gradiente
  bgCard:    'rgba(255,255,255,0.08)',
  bgCardLt:  'rgba(255,255,255,0.14)',
  bgInput:   'rgba(255,255,255,0.06)',
  // Superfície sólida (sheets, tab bar, interior do avatar)
  bgSolid:   '#15102A',

  // Acento
  accent:    '#5B4FDB',
  accentLt:  '#8B7CFF',
  accentDk:  '#3B2F9E',
  accentSoft:'rgba(91,79,219,0.28)',
  pink:      '#F27B9B',
  pinkLt:    '#F9A8C0',
  blue:      '#6FB3F2',

  // Texto
  text:      '#FFFFFF',
  textSec:   '#C3C0D6',
  textMuted: '#8B879E',
  textOnLight: '#0F0B22',

  // Bordas
  border:    'rgba(255,255,255,0.14)',
  borderLt:  'rgba(255,255,255,0.26)',

  // Estados
  success:   '#3DDC97',
  successSoft: 'rgba(61,220,151,0.16)',
  danger:    '#FF4B4B',
  dangerSoft:'rgba(255,75,75,0.16)',
  warning:   '#F5B84A',
  warningSoft:'rgba(245,184,74,0.16)',
  info:      '#6FB3F2',
  infoSoft:  'rgba(111,179,242,0.16)',

  // Tab bar flutuante
  tabBar:    '#0E0B1B',
  tabInactive: '#8B879E',
} as const;

export const R = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 } as const;

/** Espaço reservado no fim das listas para não ficarem sob a tab bar flutuante. */
export const TAB_BAR_SPACE = 108;

/** Sombra/glow suave para elementos elevados (iOS, Android e web). */
export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  glow: {
    shadowColor: C.accentLt,
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
} as const;

/** Largura máxima da coluna de conteúdo em telas largas (web/tablet). */
export const CONTENT_MAX_WIDTH = 720;

/** Largura máxima da tab bar flutuante — centralizada na mesma coluna do conteúdo. */
export const TAB_BAR_MAX_WIDTH = 560;
