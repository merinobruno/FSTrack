import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [workspace, setWorkspace] = useState('');
  const [cuenta, setCuenta] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const result = await signIn({
      workspace,
      cuenta,
      password,
    });

    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error || 'No se pudo iniciar sesión.');
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor:
              colorScheme === 'dark'
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(128,128,128,0.08)',
            borderColor:
              colorScheme === 'dark'
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(0,0,0,0.08)',
          },
        ]}
      >
        <ThemedText type="title" style={styles.title}>
          FSTrack
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          Ingreso a la aplicación
        </ThemedText>

        <ThemedText>Espacio de Trabajo</ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff',
              borderColor: colorScheme === 'dark' ? '#3a3a3c' : '#999',
              color: theme.text,
            },
          ]}
          value={workspace}
          onChangeText={setWorkspace}
          placeholder="Ej: Fisterra"
          placeholderTextColor={colorScheme === 'dark' ? '#8e8e93' : '#777'}
        />

        <ThemedText>Cuenta</ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff',
              borderColor: colorScheme === 'dark' ? '#3a3a3c' : '#999',
              color: theme.text,
            },
          ]}
          value={cuenta}
          onChangeText={setCuenta}
          placeholder="Ej: admin"
          placeholderTextColor={colorScheme === 'dark' ? '#8e8e93' : '#777'}
        />

        <ThemedText>Contraseña</ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff',
              borderColor: colorScheme === 'dark' ? '#3a3a3c' : '#999',
              color: theme.text,
            },
          ]}
          value={password}
          onChangeText={setPassword}
          placeholder="********"
          placeholderTextColor={colorScheme === 'dark' ? '#8e8e93' : '#777'}
          secureTextEntry
        />

        <Pressable
          style={[
            styles.loginButton,
            {
              backgroundColor: theme.tint,
              borderColor: theme.tint,
              opacity: loading ? 0.7 : 1,
            },
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colorScheme === 'dark' ? '#000' : '#fff'} />
          ) : (
            <ThemedText
              style={[
                styles.loginButtonText,
                {
                  color: colorScheme === 'dark' ? '#000' : '#fff',
                },
              ]}
            >
              Ingresar
            </ThemedText>
          )}
        </Pressable>

        <ThemedText
          style={[
            styles.helpText,
            {
              color: colorScheme === 'dark' ? '#a1a1aa' : '#666',
            },
          ]}
        >
          Demo actual:
          {'\n'}Workspace: Fisterra
          {'\n'}Cuenta: admin
          {'\n'}Contraseña: 1234
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    gap: 12,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  title: {
    fontFamily: Fonts.rounded,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 44,
  },
  loginButton: {
    marginTop: 8,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  loginButtonText: {
    fontWeight: '600',
  },
  helpText: {
    marginTop: 10,
    fontSize: 12,
  },
});