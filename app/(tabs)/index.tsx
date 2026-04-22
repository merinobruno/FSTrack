import { Picker } from '@react-native-picker/picker';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Button,
  Platform,
  StyleSheet,
  View
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { router } from 'expo-router';

export default function TabTwoScreen() {
  const { signOut } = useAuth();
  const { clearSelectedCompany } = useCompany();
  const { user } = useAuth();
  const {
    companies,
    selectedCompany,
    setSelectedCompanyByValue,
    loadingCompanies,
  } = useCompany();

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

      <ThemedText>Carga de Formularios de Hacienda.</ThemedText>

      {user && (
        <ThemedView style={styles.infoBox}>
          <ThemedText>Dominio: {user.workspace}</ThemedText>
          <ThemedText>Cuenta: {user.cuenta}</ThemedText>
        </ThemedView>
      )}

      <ThemedView style={styles.formContainer}>
        <ThemedText type="subtitle">Empresa</ThemedText>

        <View style={styles.pickerContainer}>
          {loadingCompanies ? (
            <View style={styles.pickerLoadingContainer}>
              <ActivityIndicator />
            </View>
          ) : (
            <Picker
              selectedValue={selectedCompany?.value ?? ''}
              onValueChange={(value) => setSelectedCompanyByValue(String(value))}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Seleccionar empresa..." value="" />
              {companies.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          )}
        </View>

        {selectedCompany ? (
          <ThemedText style={styles.selectedText}>
            Empresa seleccionada: {selectedCompany.label}
          </ThemedText>
        ) : (
          <ThemedText style={styles.selectedText}>
            No hay empresa seleccionada.
          </ThemedText>
          
        )}
        <Button
          title="Cerrar sesión"
          onPress={async () => {
            await clearSelectedCompany();
            await signOut();
            router.replace('/login');
          }}
        />
      </ThemedView>
      
    </ParallaxScrollView>
    
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  infoBox: {
    gap: 6,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.08)',
  },
  formContainer: {
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.08)',
  },
  logoBackground: {
    width: 220,
    height: 220,
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    backgroundColor: '#fff',
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pickerLoadingContainer: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  picker: {
    height: 44,
    width: '100%',
  },
  pickerItem: {
    fontSize: 14,
    height: 44,
  },
  selectedText: {
    marginTop: 4,
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