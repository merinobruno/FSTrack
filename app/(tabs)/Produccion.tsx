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
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Main form fields
  const [haciendaCategoriaCodigo, setHaciendaCategoriaCodigo] = useState('');
  const [establecimientoCodigo, setEstablecimientoCodigo] = useState('');
  const [campanaCodigo, setCampanaCodigo] = useState('codigoFKBSACampana');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [identificacionExterna, setIdentificacionExterna] = useState('');
  const [fecha, setFecha] = useState('2026-04-08');
  const [cabezas, setCabezas] = useState('1234.56');
  const [tropa, setTropa] = useState('');
  const [transaccionSubtipoCodigo, setTransaccionSubtipoCodigo] = useState('codigoFKFAFTransaccionSubtipo');
  const [descripcion, setDescripcion] = useState('');
  const [loteCodigo, setLoteCodigo] = useState('');

  // OperacionCotizaciones[0]
  const [monedaCodigo, setMonedaCodigo] = useState('codigoFKBSMoneda');
  const [cotizacion, setCotizacion] = useState('1234.56');

  // MovimientoHaciendaProduccionLeche[0]
  const [dosis, setDosis] = useState('1234.56');
  const [productoCodigo, setProductoCodigo] = useState('codigoFKBSProducto');
  const [ufc, setUfc] = useState('1234.56');
  const [temperatura, setTemperatura] = useState('1234.56');
  const [organizacionStockCodigo, setOrganizacionStockCodigo] = useState('');
  const [grasa, setGrasa] = useState('1234.56');
  const [movimientoLoteCodigo, setMovimientoLoteCodigo] = useState('codigoFKBSDeposito');
  const [proteinas, setProteinas] = useState('1234.56');
  const [acidez, setAcidez] = useState('1234.56');
  const [celSomaticas, setCelSomaticas] = useState('1234.56');
  const [partidaCodigo, setPartidaCodigo] = useState('codigoFKBSPartida');

  const client_id = 'a95197901b600187ba9e7712e547482e';
  const client_secret = 'a38d9c762c5108bbb5800c4b7b49a2f1';

  const tokenUrl =
    'https://api.teamplace.finneg.com/api/oauth/token?grant_type=client_credentials&client_id=' +
    client_id +
    '&client_secret=' +
    client_secret;

  const sendProduccion = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);

    try {
      // 1) Get token
      const tokenResponse = await fetch(tokenUrl);

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.text();
      console.log('Token response:', tokenData);

      // 2) Build payload
      const payload = {
        HaciendaCategoriaCodigo: haciendaCategoriaCodigo,
        EstablecimientoCodigo: establecimientoCodigo,
        CampanaCodigo: campanaCodigo,
        NumeroDocumento: numeroDocumento,
        IdentificacionExterna: identificacionExterna,
        Fecha: fecha,
        OperacionCotizaciones: [
          {
            MonedaCodigo: monedaCodigo,
            Cotizacion: Number(cotizacion),
          },
        ],
        Cabezas: Number(cabezas),
        Tropa: tropa,
        TransaccionSubtipoCodigo: transaccionSubtipoCodigo,
        Descripcion: descripcion,
        LoteCodigo: loteCodigo,
        MovimientoHaciendaProduccionLeche: [
          {
            Dosis: Number(dosis),
            ProductoCodigo: productoCodigo,
            UFC: Number(ufc),
            Temperatura: Number(temperatura),
            OrganizacionStockCodigo: organizacionStockCodigo,
            Grasa: Number(grasa),
            LoteCodigo: movimientoLoteCodigo,
            Proteinas: Number(proteinas),
            Acidez: Number(acidez),
            CelSomaticas: Number(celSomaticas),
            PartidaCodigo: partidaCodigo,
          },
        ],
      };

      console.log('Payload:', JSON.stringify(payload, null, 2));

      // 3) Send POST to API
      // Replace this URL with the real Finnegans endpoint for alta/POST
      const apiCall = await fetch(
        'https://api.finneg.com/api/produccionLeche?ACCESS_TOKEN=' + tokenData,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await apiCall.text();

      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        parsedResponse = responseText;
      }

      if (!apiCall.ok) {
        throw new Error(
          `API request failed: ${apiCall.status} - ${JSON.stringify(parsedResponse)}`
        );
      }

      setApiResponse(parsedResponse);
      console.log('API response:', parsedResponse);
    } catch (err: any) {
      console.error('Error sending data:', err);
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
          Producción
        </ThemedText>
      </ThemedView>

      <ThemedText>Formulario de Alta de Producción.</ThemedText>

      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle">Producción Hacienda</ThemedText>

        <ThemedText>HaciendaCategoriaCodigo</ThemedText>
        <TextInput style={styles.input} value={haciendaCategoriaCodigo} onChangeText={setHaciendaCategoriaCodigo} />

        <ThemedText>EstablecimientoCodigo</ThemedText>
        <TextInput style={styles.input} value={establecimientoCodigo} onChangeText={setEstablecimientoCodigo} />

        <ThemedText>CampanaCodigo</ThemedText>
        <TextInput style={styles.input} value={campanaCodigo} onChangeText={setCampanaCodigo} />

        <ThemedText>NumeroDocumento</ThemedText>
        <TextInput style={styles.input} value={numeroDocumento} onChangeText={setNumeroDocumento} />

        <ThemedText>IdentificacionExterna</ThemedText>
        <TextInput style={styles.input} value={identificacionExterna} onChangeText={setIdentificacionExterna} />

        <ThemedText>Fecha</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={fecha}
          onChangeText={setFecha}
        />

        <ThemedText>Cabezas</ThemedText>
        <TextInput
          style={styles.input}
          value={cabezas}
          onChangeText={setCabezas}
          keyboardType="numeric"
        />

        <ThemedText>Tropa</ThemedText>
        <TextInput style={styles.input} value={tropa} onChangeText={setTropa} />

        <ThemedText>TransaccionSubtipoCodigo</ThemedText>
        <TextInput
          style={styles.input}
          value={transaccionSubtipoCodigo}
          onChangeText={setTransaccionSubtipoCodigo}
        />

        <ThemedText>Descripcion</ThemedText>
        <TextInput style={styles.input} value={descripcion} onChangeText={setDescripcion} />

        <ThemedText>LoteCodigo</ThemedText>
        <TextInput style={styles.input} value={loteCodigo} onChangeText={setLoteCodigo} />

        <ThemedText type="subtitle">Operación Cotización</ThemedText>

        <ThemedText>MonedaCodigo</ThemedText>
        <TextInput style={styles.input} value={monedaCodigo} onChangeText={setMonedaCodigo} />

        <ThemedText>Cotizacion</ThemedText>
        <TextInput
          style={styles.input}
          value={cotizacion}
          onChangeText={setCotizacion}
          keyboardType="numeric"
        />

        <ThemedText type="subtitle">Movimiento Hacienda Producción Leche</ThemedText>

        <ThemedText>Dosis</ThemedText>
        <TextInput style={styles.input} value={dosis} onChangeText={setDosis} keyboardType="numeric" />

        <ThemedText>ProductoCodigo</ThemedText>
        <TextInput style={styles.input} value={productoCodigo} onChangeText={setProductoCodigo} />

        <ThemedText>UFC</ThemedText>
        <TextInput style={styles.input} value={ufc} onChangeText={setUfc} keyboardType="numeric" />

        <ThemedText>Temperatura</ThemedText>
        <TextInput
          style={styles.input}
          value={temperatura}
          onChangeText={setTemperatura}
          keyboardType="numeric"
        />

        <ThemedText>OrganizacionStockCodigo</ThemedText>
        <TextInput
          style={styles.input}
          value={organizacionStockCodigo}
          onChangeText={setOrganizacionStockCodigo}
        />

        <ThemedText>Grasa</ThemedText>
        <TextInput style={styles.input} value={grasa} onChangeText={setGrasa} keyboardType="numeric" />

        <ThemedText>LoteCodigo</ThemedText>
        <TextInput
          style={styles.input}
          value={movimientoLoteCodigo}
          onChangeText={setMovimientoLoteCodigo}
        />

        <ThemedText>Proteinas</ThemedText>
        <TextInput
          style={styles.input}
          value={proteinas}
          onChangeText={setProteinas}
          keyboardType="numeric"
        />

        <ThemedText>Acidez</ThemedText>
        <TextInput style={styles.input} value={acidez} onChangeText={setAcidez} keyboardType="numeric" />

        <ThemedText>CelSomaticas</ThemedText>
        <TextInput
          style={styles.input}
          value={celSomaticas}
          onChangeText={setCelSomaticas}
          keyboardType="numeric"
        />

        <ThemedText>PartidaCodigo</ThemedText>
        <TextInput style={styles.input} value={partidaCodigo} onChangeText={setPartidaCodigo} />

        <Button
          title={loading ? 'Sending...' : 'Send Production'}
          onPress={sendProduccion}
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