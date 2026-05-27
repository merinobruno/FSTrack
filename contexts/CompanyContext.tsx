import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFinnegansToken } from '@/utils/get-finnegans-token';
import { API_BASE_URL } from '@/constants/api';

type CompanyOption = {
  label: string;
  value: string;
};

type CompanyContextType = {
  companies: CompanyOption[];
  selectedCompany: CompanyOption | null;
  setSelectedCompanyByValue: (value: string) => Promise<void>;
  clearSelectedCompany: () => Promise<void>;
  loadingCompanies: boolean;
  refreshCompanies: () => Promise<void>;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const COMPANY_STORAGE_KEY = 'fstrack_selected_company';

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const loadStoredCompanyValue = async () => {
    try {
      return await AsyncStorage.getItem(COMPANY_STORAGE_KEY);
    } catch (error) {
      console.error('Error reading stored company:', error);
      return null;
    }
  };

  const saveStoredCompanyValue = async (value: string) => {
    try {
      await AsyncStorage.setItem(COMPANY_STORAGE_KEY, value);
    } catch (error) {
      console.error('Error saving selected company:', error);
    }
  };

  const clearSelectedCompany = async () => {
    try {
      await AsyncStorage.removeItem(COMPANY_STORAGE_KEY);
      setSelectedCompany(null);
    } catch (error) {
      console.error('Error clearing selected company:', error);
    }
  };

  const refreshCompanies = async () => {
    if (!user?.token) return;
    try {
      setLoadingCompanies(true);

      const token = await getFinnegansToken(user.token);

      const response = await fetch(
        `https://api.finneg.com/api/empresaSucursal/list?ACCESS_TOKEN=${token}`
      );

      if (!response.ok) {
        throw new Error(`Company request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('ApiEstablecimiento response:', data);

      const rows = Array.isArray(data)
  ? data
  : Array.isArray(data?.data)
  ? data.data
  : Array.isArray(data?.rows)
  ? data.rows
  : Array.isArray(data?.result)
  ? data.result
  : [];

const activeRows = rows.filter((item: any) => {
  const activo = item.activo ?? item.ACTIVO;
  return activo === true || activo === 'true' || activo === 1 || activo === '1';
});

const options: CompanyOption[] = activeRows
  .map((item: any) => ({
    label:
      item.nombre ??
      item.NOMBRE ??
      item.establecimiento ??
      item.Establecimiento ??
      item.descripcion ??
      item.Descripcion ??
      item.codigo ??
      item.CODIGO ??
      '',
    value:
      item.codigo ??
      item.CODIGO ??
      item.empresaCodigo ??
      item.EmpresaCodigo ??
      item.establecimientoCodigo ??
      item.EstablecimientoCodigo ??
      item.value ??
      '',
  }))
  .filter((item: CompanyOption) => item.label && item.value);

      // Filter to account-assigned companies; empty list = no restriction
      let allowedCodes: string[] = [];
      try {
        const acRes = await fetch(`${API_BASE_URL}/auth/my-companies`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (acRes.ok) {
          const acData = await acRes.json();
          allowedCodes = acData.codes ?? [];
        }
      } catch {}

      const filtered = allowedCodes.length > 0
        ? options.filter((c) => allowedCodes.includes(c.value))
        : options;

      setCompanies(filtered);

      const storedValue = await loadStoredCompanyValue();

      if (storedValue) {
        const restored = filtered.find((company) => company.value === storedValue) || null;
        setSelectedCompany(restored);
      } else {
        setSelectedCompany(null);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    refreshCompanies();
  }, [user?.token]);

  const setSelectedCompanyByValue = async (value: string) => {
    const found = companies.find((company) => company.value === value) || null;
    setSelectedCompany(found);

    if (found) {
      await saveStoredCompanyValue(found.value);
    } else {
      await AsyncStorage.removeItem(COMPANY_STORAGE_KEY);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        setSelectedCompanyByValue,
        clearSelectedCompany,
        loadingCompanies,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error('useCompany must be used inside CompanyProvider');
  }

  return context;
}
