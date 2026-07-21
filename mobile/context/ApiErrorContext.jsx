// mobile/context/ApiErrorContext.jsx
import React, { createContext, useContext } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './AuthContext';
import { AuthError } from '../../shared/services/api';

const ApiErrorContext = createContext(undefined);

export function ApiErrorProvider({ children }) {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleApiError = (error) => {
    if (error instanceof AuthError) {
      signOut();
      router.replace('/(auth)/login');
      return;
    }
    const message = error?.message ?? 'An unexpected error occurred. Please try again.';
    Alert.alert('Error', message);
  };

  const value = { handleApiError };

  return (
    <ApiErrorContext.Provider value={value}>
      {children}
    </ApiErrorContext.Provider>
  );
}

export function useApiError() {
  const ctx = useContext(ApiErrorContext);
  if (!ctx) {
    throw new Error('useApiError must be used within an ApiErrorProvider');
  }
  return ctx;
}
