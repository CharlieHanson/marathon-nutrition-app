import { Slot } from 'expo-router';
import { AppLayout } from '../../components/AppLayout';

export default function AppLayoutWrapper() {
  return (
    <AppLayout>
      <Slot />
    </AppLayout>
  );
}

