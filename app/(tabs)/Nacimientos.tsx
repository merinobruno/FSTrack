import { useState } from 'react';
import {
    ActivityIndicator,
    Button,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function TabTwoScreen() {
  const [updatedSince, setUpdatedSince] = useState('2026-01-01');
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const client_id = 'a95197901b600187ba9e7712e547482e';
  const client_secret = 'a38d9c762c5108bbb5800c4b7b49a2f1';

  const tokenUrl =
    'https://api.teamplace.finneg.com/api/oauth/token?grant_type=client_credentials&client_id=' +
    client_id +
    '&client_secret=' +
    client_secret;

  const getAPIData = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      const tokenResponse = await fetch(tokenUrl);

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.text();
      console.log('Token response:', tokenData);

      const apiCall = await fetch(
        'https://api.finneg.com/api/reports/NACHACIENDA?ACCESS_TOKEN=' +
          tokenData +
          '&PARAMWEBREPORT_FechaDesde=20260101' +
           '&PARAMWEBREPORT_FechaHasta=20260401' +
           '&PARAMWEBREPORT_ProductoID=NAC' +
           '&PARAMEmpresa=82'
      );

      if (!apiCall.ok) {
        throw new Error(`API request failed: ${apiCall.status}`);
      }

      const apiData = await apiCall.json();

      setApiResponse(apiData);
      console.log('API response:', apiData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}
        >
          Nacimientos
        </ThemedText>
      </ThemedView>

      <ThemedText>Formulario de Alta de Nacimientos.</ThemedText>

      {/* FORM */}
      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle">Nacimientos Hacienda</ThemedText>

        <ThemedText>Updated Since</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={updatedSince}
          onChangeText={setUpdatedSince}
        />

        <Button
          title={loading ? 'Loading...' : 'Get API Data'}
          onPress={getAPIData}
          disabled={loading}
        />

        {loading && <ActivityIndicator style={styles.loader} />}

        {error && <ThemedText style={styles.errorText}>Error: {error}</ThemedText>}

        {apiResponse && (
          <ThemedView style={styles.responseBox}>
            <ThemedText type="subtitle">API Response</ThemedText>
            <ScrollView horizontal>
              <ThemedText style={styles.responseText}>
                {JSON.stringify(apiResponse, null, 2)}
              </ThemedText>
            </ScrollView>
          </ThemedView>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  formContainer: {
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.08)',
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  loader: {
    marginTop: 8,
  },
  errorText: {
    color: 'red',
  },
  responseBox: {
    marginTop: 8,
    gap: 8,
  },
  responseText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      web: 'monospace',
    }),
  },
});