import { Redirect } from 'expo-router';

// Unused route — redirect to home
export default function ModalScreen() {
  return <Redirect href="/(tabs)" />;
}
