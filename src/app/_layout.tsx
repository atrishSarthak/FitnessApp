import "../global.css";
import { Slot } from "expo-router";
import { ClerkProvider, ClerkLoaded } from "@clerk/expo";
import * as SecureStore from 'expo-secure-store'

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

// Token cache for persisting authentication
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key)
    } catch (err) {
      console.error('Error getting token:', err)
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value)
    } catch (err) {
      console.error('Error saving token:', err)
    }
  },
}

export default function Layout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <Slot />
    </ClerkProvider>
  );
}
