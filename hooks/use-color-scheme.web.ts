/**
 * Variante web. Igual que la nativa: el esquema es fijo en claro, así que no
 * hay desajuste de hidratación posible entre servidor y cliente y el hook ya
 * no necesita esperar al montaje.
 */
export function useColorScheme(): 'light' {
  return 'light';
}
