/**
 * Sistema de diseño Fisterra — tokens para FSTrack.
 *
 * Fuente de verdad: `Assets - Fisterra/DESIGN-SYSTEM.md` y
 * `brand/tokens/fisterra.tokens.json`. Los colores están muestreados de las
 * piezas aprobadas; no inventar valores nuevos acá.
 *
 * Reglas del sistema que este archivo codifica:
 *  - Nunca fondo blanco. La página es gris `surface`; el blanco es filo de
 *    panel y texto sobre navy.
 *  - `navy` es para superficies, `ink` es para texto. No son intercambiables.
 *  - El rojo de marca solo se usa en carga tipográfica grande (>= 24px bold)
 *    o en el isotipo. Nunca en cuerpo de texto.
 *  - Los rojos semánticos (error) son distintos del rojo de marca para no
 *    colisionar con el acento.
 */

import { Platform } from 'react-native';

/* ------------------------------------------------------------------ *
 * Color
 * ------------------------------------------------------------------ */

export const Palette = {
  /** Acento primario. Titulares, isotipo, CTA. Único color saturado. */
  red: '#F52125',
  /** Cara en sombra del isotipo. Estado pressed sobre superficies rojas. */
  redDeep: '#9C3032',
  /** Institucional. Pills, tab activa, superficies oscuras. */
  navy: '#0A2F43',
  /** Color tipográfico. Azul tinta, nunca negro. */
  ink: '#202B56',

  surfaceHigh: '#E4E5E9',
  surface: '#D7D8DD',
  surfaceLow: '#B8C4D4',
  steel: '#A3ABB6',
  steelDeep: '#6E7A88',
  /**
   * Texto secundario. El `steelDeep` del sistema da 3.47:1 sobre el panel, que
   * alcanza para bordes e iconografía pero no para rótulos de 11–13px. Este es
   * el mismo acero llevado a 5.06:1 para poder usarlo como color de texto.
   */
  steelText: '#556169',
  white: '#FFFFFF',
} as const;

/**
 * Colores semánticos.
 *
 * Reemplazan a los cinco rojos (`#dc2626`, `#b00020`, `#ff0000`, `#b91c1c`,
 * `#ef4444`) y los dos verdes (`#059669`, `#4caf50`) que convivían en la app.
 * Todos verificados AA (>= 4.5:1) sobre `surface` y sobre `surfaceHigh`.
 */
export const Semantic = {
  /** Error / envío fallido. 5.6:1 sobre surface. Distinto del rojo de marca. */
  error: '#A11221',
  errorTint: 'rgba(161, 18, 33, 0.10)',
  errorEdge: 'rgba(161, 18, 33, 0.30)',

  /** Éxito / enviado. 4.9:1 sobre surface. */
  success: '#14664B',
  successTint: 'rgba(20, 102, 75, 0.10)',
  successEdge: 'rgba(20, 102, 75, 0.30)',

  /** Pendiente / en cola. 5.1:1 sobre surface. */
  pending: '#7A4E0A',
  pendingTint: 'rgba(122, 78, 10, 0.10)',
  pendingEdge: 'rgba(122, 78, 10, 0.30)',

  /** Informativo. Usa el navy institucional. */
  info: Palette.navy,
  infoTint: 'rgba(10, 47, 67, 0.08)',
  infoEdge: 'rgba(10, 47, 67, 0.25)',
} as const;

/**
 * Degradés. Cada uno tiene una función fija; el del pill es la firma visual
 * del sistema y siempre va de claro a oscuro en el sentido de lectura.
 *
 * Formato de tuplas para `expo-linear-gradient` (colors + locations).
 */
export const Gradients = {
  /** Pill de sección y tab activa. */
  navy: {
    colors: ['#A8B4C4', '#15384B', '#0A2F43'] as const,
    locations: [0, 0.45, 1] as const,
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
  /** Variante sólida para superficies chicas (tabs, botones). */
  navySolid: {
    colors: ['#1C4257', '#0A2F43'] as const,
    locations: [0, 1] as const,
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
  /** Fondo de pantalla. Diagonal, casi imperceptible. */
  surface: {
    colors: ['#E4E5E9', '#D7D8DD', '#B8C4D4'] as const,
    locations: [0, 0.45, 1] as const,
    start: { x: 0.1, y: 0 },
    end: { x: 0.9, y: 1 },
  },
  /** Chip de paginación / contador. */
  chip: {
    colors: ['#C3CAD4', '#9FAFC2'] as const,
    locations: [0, 1] as const,
    start: { x: 0, y: 0.5 },
    end: { x: 1, y: 0.5 },
  },
} as const;

/* ------------------------------------------------------------------ *
 * Tipografía
 * ------------------------------------------------------------------ */

/** Nombres de familia tal como los registra `expo-font` en `app/_layout.tsx`. */
export const FontFamily = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
  italic: 'Montserrat_400Regular_Italic',
} as const;

/**
 * Escala móvil.
 *
 * El design system define escalas para lienzos de 1440x810 (16:9) y 1080x1080
 * (1:1). Ninguna se traslada linealmente a una pantalla de ~390pt: el cuerpo
 * quedaría en 8pt. Lo que se preserva son las *proporciones* del sistema
 * (display ≈ 2.6x cuerpo, interlínea 1.05 en titulares y 1.55 en cuerpo),
 * con los tamaños absolutos llevados al piso legible de móvil.
 *
 * `display` y `displaySm` son los únicos roles donde el rojo de marca está
 * permitido: ambos superan los 24px bold que exige el sistema.
 */
export const Type = {
  display: { fontSize: 28, lineHeight: 29 },
  displaySm: { fontSize: 24, lineHeight: 25 },
  title: { fontSize: 20, lineHeight: 26 },
  section: { fontSize: 17, lineHeight: 23 },
  wordmark: { fontSize: 16, lineHeight: 20 },
  body: { fontSize: 15, lineHeight: 23 },
  label: { fontSize: 13, lineHeight: 18 },
  pill: { fontSize: 13, lineHeight: 17 },
  caption: { fontSize: 12, lineHeight: 17 },
  micro: { fontSize: 11, lineHeight: 15 },
} as const;

export const Leading = { tight: 1.05, body: 1.55 } as const;

/* ------------------------------------------------------------------ *
 * Forma y profundidad
 * ------------------------------------------------------------------ */

export const Radius = {
  pill: 999,
  panel: 28,
  card: 18,
  media: 16,
  field: 12,
  tab: 12,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Movimiento.
 *
 * El sistema Fisterra está definido para piezas impresas y no especifica
 * motion, así que estos valores no salen de él. El criterio: FSTrack es una
 * app de carga de datos que se usa a campo, donde la transición no debe
 * hacerse notar. Un fundido corto quita el corte seco entre pantallas sin
 * agregar espera perceptible.
 */
export const Motion = {
  /** Fundido entre pantallas de un stack. */
  screen: 200,
  /** Fundido cruzado entre pestañas. Más corto porque se dispara más seguido. */
  tab: 160,
  /** Entrada de una hoja inferior: el fondo funde mientras el panel sube. */
  sheet: 240,
} as const;

export const Effects = {
  /** Filo blanco del panel. */
  hairline: 'rgba(255, 255, 255, 0.85)',
  /** Borde tenue para campos y tarjetas sobre gris. */
  edge: 'rgba(10, 47, 67, 0.12)',
  panelShadow: {
    shadowColor: Palette.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  logoShadow: {
    shadowColor: Palette.navy,
    shadowOffset: { width: 6, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

/* ------------------------------------------------------------------ *
 * Tema
 * ------------------------------------------------------------------ */

/**
 * La app es de modo claro únicamente: el sistema Fisterra no define variante
 * oscura y su regla base es el fondo gris. `dark` existe con los mismos
 * valores para que cualquier consumidor residual de `useColorScheme()` siga
 * viendo la paleta de marca en lugar del turquesa del template de Expo.
 */
const fisterraScheme = {
  text: Palette.ink,
  textMuted: Palette.steelText,
  textOnDark: Palette.white,
  background: Palette.surface,
  panel: Palette.surfaceHigh,
  tint: Palette.red,
  icon: Palette.navy,
  iconMuted: Palette.steelDeep,
  border: Effects.edge,
  tabIconDefault: Palette.steelDeep,
  tabIconSelected: Palette.red,
} as const;

export const Colors = {
  light: fisterraScheme,
  dark: fisterraScheme,
};

/**
 * Compat con el scaffolding de Expo: algunos componentes del template todavía
 * piden `Fonts.rounded` / `Fonts.mono`. Se mapean a Montserrat para que nada
 * caiga en la fuente de sistema.
 */
export const Fonts = {
  sans: FontFamily.regular,
  serif: FontFamily.regular,
  rounded: FontFamily.semibold,
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }) as string,
};
