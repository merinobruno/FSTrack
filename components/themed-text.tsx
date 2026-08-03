import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Palette, Type } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  /** @deprecated La app es de modo claro únicamente. Usá `color`. */
  lightColor?: string;
  /** @deprecated La app es de modo claro únicamente. Usá `color`. */
  darkColor?: string;
  color?: string;
  type?:
    | 'default'
    | 'title'
    | 'defaultSemiBold'
    | 'subtitle'
    | 'link'
    | 'label'
    | 'caption'
    | 'italic';
};

/**
 * Texto de marca. Todo el tipo pasa por Montserrat y por la escala de
 * `Type`; el color por defecto es la tinta `#202B56`, nunca negro.
 */
export function ThemedText({
  style,
  lightColor,
  color,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      style={[
        styles.base,
        styles[type],
        { color: color ?? lightColor ?? Palette.ink },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: FontFamily.regular,
    color: Palette.ink,
  },
  default: Type.body,
  defaultSemiBold: {
    ...Type.body,
    fontFamily: FontFamily.semibold,
  },
  title: {
    ...Type.display,
    fontFamily: FontFamily.bold,
    color: Palette.navy,
  },
  subtitle: {
    ...Type.section,
    fontFamily: FontFamily.semibold,
    color: Palette.navy,
  },
  label: {
    ...Type.label,
    fontFamily: FontFamily.medium,
    color: Palette.steelText,
  },
  caption: {
    ...Type.caption,
    color: Palette.steelText,
  },
  italic: {
    ...Type.body,
    fontFamily: FontFamily.italic,
  },
  link: {
    ...Type.body,
    fontFamily: FontFamily.medium,
    color: Palette.navy,
    textDecorationLine: 'underline',
  },
});
