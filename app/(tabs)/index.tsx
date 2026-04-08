import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Platform,
  StyleSheet
} from 'react-native';

import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
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
  <>

    <Image
      source={require('@/assets/images/Fisterra-logo.png')}
      style={styles.logoBackground}
      contentFit="contain"
    />
  </>
}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}
        >
          FSTrack
        </ThemedText>
      </ThemedView>

      <ThemedText>Carga de Formularios.</ThemedText>
      <ThemedText type="subtitle">Guías</ThemedText>

      

      <Collapsible title="File-based routing">
        <ThemedText>
          This app has two screens:{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">app/(tabs)/Muertes.tsx</ThemedText>
          <ThemedText type="defaultSemiBold">app/(tabs)/Nacimientos.tsx</ThemedText>
          <ThemedText type="defaultSemiBold">app/(tabs)/Produccion.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          The layout file in <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{' '}
          sets up the tab navigator.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="Android, iOS, and web support">
        <ThemedText>
          You can open this project on Android, iOS, and the web. To open the web version, press{' '}
          <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Images">
        <ThemedText>
          For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for
          different screen densities
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="Light and dark mode components">
        <ThemedText>
          This template has light and dark mode support. The{' '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect
          what the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="Animations">
        <ThemedText>
          This template includes an example of an animated component. The{' '}
          <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> component uses
          the powerful{' '}
          <ThemedText type="defaultSemiBold" style={{ fontFamily: Fonts.mono }}>
            react-native-reanimated
          </ThemedText>{' '}
          library to create a waving hand animation.
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
              component provides a parallax effect for the header image.
            </ThemedText>
          ),
        })}
      </Collapsible>
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
  logoBackground: {
  width: 220,
  height: 220,
  position: 'absolute',
  alignSelf: 'center',
  bottom: 20,
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