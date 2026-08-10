import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  Text,
  View,
} from 'react-native';

import {
  Button,
  Field,
  Lockup,
  PairedHeading,
  Panel,
  Screen,
  StatusBox,
} from '@/components/brand';
import { FontFamily, Palette, Spacing, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { type ApiError } from '@/utils/api-error';

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [workspace, setWorkspace] = useState('');
  const [cuenta, setCuenta] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const cuentaInputRef = useRef<RNTextInput>(null);
  const passwordInputRef = useRef<RNTextInput>(null);

  const handleLogin = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await signIn({ workspace, cuenta, password });

    setLoading(false);

    if (!result.success) {
      // El error va en la pantalla, no en `Alert.alert`: en web react-native
      // no implementa Alert, así que el fallo era completamente silencioso.
      setError(result.error ?? { title: 'No se pudo iniciar sesión.' });
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Lockup size={34} style={styles.lockup} />

          <Panel style={styles.panel}>
            <PairedHeading line1="FSTRACK" line2="Ingreso" />

            <Text style={styles.claim}>Carga de formularios de hacienda</Text>

            <View style={styles.fields}>
              <Field
                label="Espacio de trabajo"
                value={workspace}
                onChangeText={setWorkspace}
                placeholder="Ej: Fisterra"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => cuentaInputRef.current?.focus()}
              />

              <Field
                ref={cuentaInputRef}
                label="Cuenta"
                value={cuenta}
                onChangeText={setCuenta}
                placeholder="Ej: admin"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />

              <Field
                ref={passwordInputRef}
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="********"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            {error && (
              <StatusBox variant="error" title={error.title} detail={error.detail} />
            )}

            <Button
              title="Ingresar"
              variant="accent"
              onPress={handleLogin}
              loading={loading}
              style={styles.cta}
            />
          </Panel>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  lockup: { alignSelf: 'center' },
  panel: { gap: Spacing.lg },
  claim: {
    ...Type.body,
    fontFamily: FontFamily.italic,
    color: Palette.ink,
    textAlign: 'right',
    marginTop: -Spacing.sm,
  },
  fields: { gap: Spacing.md },
  cta: { marginTop: Spacing.xs },
});
