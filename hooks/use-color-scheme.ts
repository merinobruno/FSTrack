/**
 * FSTrack es de modo claro únicamente.
 *
 * El sistema Fisterra no define variante oscura y su regla base es el fondo
 * gris `#D7D8DD`, así que el esquema queda fijo en lugar de seguir al
 * dispositivo. Se mantiene el hook (en vez de borrarlo) para no tocar la firma
 * de los componentes del template que todavía lo consumen.
 */
export function useColorScheme(): 'light' {
  return 'light';
}
