import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { FontFamily, Palette } from '@/constants/theme';

/**
 * Isotipo Fisterra: una montaña —o cabo— de dos caras con la base curvada en
 * arco cóncavo. La bisectriz vertical la divide en cara iluminada y cara en
 * sombra.
 *
 * La curva de la base es lo que lo distingue de un triángulo genérico y no se
 * aplana. Geometría tomada tal cual de `brand/logo/fisterra-isotipo.svg`.
 */
export function Isotipo({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d="M50 0 L0 100 Q25 95.2 50 95.2 Z" fill={Palette.red} />
      <Path d="M50 0 L50 95.2 Q75 95.2 100 100 Z" fill={Palette.redDeep} />
    </Svg>
  );
}

export type LockupProps = ViewProps & {
  /** Altura del isotipo en pt. El wordmark se dimensiona en proporción. */
  size?: number;
  /** Color del wordmark. Blanco cuando el lockup va sobre navy. */
  tone?: 'navy' | 'white';
};

/**
 * Lockup horizontal: isotipo + wordmark FISTERRA.
 *
 * Proporciones del sistema: la altura del wordmark es ~68% de la del isotipo
 * y la separación entre ambos es ~40% del ancho del isotipo. El peso Regular
 * del wordmark es deliberado — no compite con el isotipo.
 */
export function Lockup({ size = 32, tone = 'navy', style, ...rest }: LockupProps) {
  return (
    <View style={[styles.lockup, { gap: size * 0.4 }, style]} {...rest}>
      <Isotipo size={size} />
      <Text
        style={[
          styles.wordmark,
          {
            fontSize: size * 0.68,
            letterSpacing: size * 0.68 * 0.08,
            color: tone === 'white' ? Palette.white : Palette.navy,
          },
        ]}
      >
        FISTERRA
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: FontFamily.regular,
    // El wordmark carga el tracking abierto de las piezas gráficas; sin este
    // ajuste el espacio final desbalancea el centrado óptico.
    marginRight: -2,
  },
});
