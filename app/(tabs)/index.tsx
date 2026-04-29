import { Picker } from '@react-native-picker/picker';import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Button,
  Platform,
  Pressable,
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
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
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

        <View
  style={[
    styles.pickerContainer,
    {
      backgroundColor: isDark ? '#1f1f1f' : '#fff',
      borderColor: isDark ? '#555' : '#999',
    },
  ]}
>
  {loadingCompanies ? (
    <View style={styles.pickerLoadingContainer}>
      <ActivityIndicator />
    </View>
  ) : (
    <Picker
      selectedValue={selectedCompany?.value ?? ''}
      onValueChange={(value) => setSelectedCompanyByValue(String(value))}
      style={[
        styles.picker,
        {
          color: isDark ? '#fff' : '#111',
          backgroundColor: isDark ? '#1f1f1f' : '#fff',
        },
      ]}
      dropdownIconColor={isDark ? '#fff' : '#111'}
      mode="dropdown"
    >
      <Picker.Item
        label="Seleccionar empresa..."
        value=""
        color={isDark ? '#fff' : '#111'}
      />
      {companies.map((option) => (
        <Picker.Item
          key={option.value}
          label={option.label}
          value={option.value}
          color={isDark ? '#fff' : '#111'}
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
        <View style={styles.logoutContainer}>
          <Pressable
            style={styles.logoutButton}
            onPress={async () => {
              await clearSelectedCompany();
              await signOut();
              router.replace('/login');
            }}
          >
            <ThemedText style={styles.logoutButtonText}>Cerrar sesión</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
      
    </ParallaxScrollView>
    
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  logoutContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },

  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.35)',
  },

  logoutButtonText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600',
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
  borderWidth: 0,
  borderRadius: 10,
  minHeight: 56,
  justifyContent: 'center',
  paddingHorizontal: 4,
},

pickerLoadingContainer: {
  minHeight: 56,
  justifyContent: 'center',
  alignItems: 'center',
},

picker: {
  width: '100%',
  minHeight: 56,
  ...Platform.select({
    android: {
      height: 56,
    },
    ios: {
      height: 180,
    },
  }),
},

pickerItem: {
  fontSize: 14,
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