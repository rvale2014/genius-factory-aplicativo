// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="verificar-pin" />
      <Stack.Screen name="login" />
      <Stack.Screen name="recuperar-pin" />
      <Stack.Screen name="redefinir-senha" />
      <Stack.Screen name="nova-senha" />
    </Stack>
  );
}