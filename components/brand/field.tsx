import { useState, type Ref } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Effects, FontFamily, Palette, Radius, Type } from '@/constants/theme';

export type FieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  /** Atajo heredado de los formularios: equivale a `keyboardType="numeric"`. */
  numeric?: boolean;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  /** Marca el campo como no obligatorio junto al rótulo. */
  optional?: boolean;
  hint?: string;
  style?: StyleProp<ViewStyle>;
  /** Se reenvía al `TextInput` para encadenar el foco entre campos. */
  ref?: Ref<TextInput>;
};

/**
 * Campo de texto del sistema.
 *
 * Unifica los `Input` / `InputField` que estaban copiados en cinco pantallas.
 * El foco se marca con el navy institucional en el borde, no con un color de
 * acento nuevo.
 */
export function Field({
  label,
  value,
  onChangeText,
  numeric = false,
  keyboardType,
  editable = true,
  optional = false,
  hint,
  style,
  ref,
  ...rest
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional ? <Text style={styles.optional}>opcional</Text> : null}
      </View>

      <TextInput
        ref={ref}
        style={[
          styles.input,
          focused && styles.inputFocused,
          !editable && styles.inputDisabled,
        ]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType ?? (numeric ? 'numeric' : 'default')}
        placeholderTextColor={Palette.steelDeep}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  label: {
    ...Type.label,
    fontFamily: FontFamily.medium,
    color: Palette.navy,
  },
  optional: {
    ...Type.micro,
    fontFamily: FontFamily.regular,
    color: Palette.steelText,
    fontStyle: 'italic',
  },
  input: {
    ...Type.body,
    fontFamily: FontFamily.regular,
    color: Palette.ink,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Effects.edge,
    borderRadius: Radius.field,
    paddingHorizontal: 14,
    minHeight: 46,
    // Android centra mal el texto sin altura de línea explícita en el input.
    paddingVertical: 10,
  },
  inputFocused: {
    borderColor: Palette.navy,
    borderWidth: 1.5,
  },
  inputDisabled: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    color: Palette.steelText,
  },
  hint: {
    ...Type.micro,
    color: Palette.steelText,
  },
});
