import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { FontFamily, Palette, Type } from '@/constants/theme';

export type PairedHeadingProps = ViewProps & {
  /** Nombra el servicio. Va en Bold rojo. */
  line1: string;
  /** Lo califica. Va en Regular tinta. */
  line2?: string;
  size?: 'lg' | 'sm';
};

/**
 * El titular pareado: el recurso tipográfico central del sistema.
 *
 * Dos líneas del mismo cuerpo con contraste de peso y color —Bold rojo arriba,
 * Regular tinta abajo— e interlínea ajustada para que lean como una unidad.
 * Este patrón se repite en todas las piezas y no debe romperse: es lo que hace
 * reconocible al sistema.
 *
 * Solo hay dos tamaños a propósito. El rojo de marca necesita >= 24px bold
 * para ser admisible, y ambos lo superan. Va apoyado sobre `Panel`: sobre el
 * gris claro del panel el rojo llega a 3.25:1, mientras que sobre el gris de
 * página se queda en 2.88:1.
 */
export function PairedHeading({
  line1,
  line2,
  size = 'lg',
  style,
  ...rest
}: PairedHeadingProps) {
  const scale = size === 'lg' ? Type.display : Type.displaySm;

  return (
    <View style={style} {...rest}>
      <Text style={[styles.line1, scale]} allowFontScaling={false}>
        {line1}
      </Text>
      {line2 ? (
        <Text style={[styles.line2, scale]} allowFontScaling={false}>
          {line2}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  line1: {
    fontFamily: FontFamily.bold,
    color: Palette.red,
  },
  line2: {
    fontFamily: FontFamily.regular,
    color: Palette.ink,
  },
});
