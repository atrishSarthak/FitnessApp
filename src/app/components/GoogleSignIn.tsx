import React, { useCallback, useEffect } from 'react'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { useSSO } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { View, Button, Platform, Text, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons';

// Preloads the browser for Android devices to reduce authentication load time
// See: https://docs.expo.dev/guides/authentication/#improving-user-experience
export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return
    void WebBrowser.warmUpAsync()
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync()
    }
  }, [])
}

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession()

export default function GoogleSignIn() {
  useWarmUpBrowser()

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO()
  const router = useRouter()
  const [error, setError] = React.useState<string>('')
  const [isLoading, setIsLoading] = React.useState(false)

  const onPress = useCallback(async () => {
    if (isLoading) return
    
    setError('')
    setIsLoading(true)
    
    try {
      console.log('Google Sign In button pressed')
      
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      })

      console.log('SSO Flow completed:', { createdSessionId })

      // If sign in was successful, set the active session
      if (createdSessionId) {
        console.log('Setting active session:', createdSessionId)
        setActive!({
          session: createdSessionId,
          navigate: async ({ session, decorateUrl }) => {
            if (session?.currentTask) {
              console.log('Session has current task:', session?.currentTask)
              return
            }

            const url = decorateUrl('/')
            console.log('Navigating to:', url)
            router.push(url)
          },
        })
      } else {
        console.log('No session created - missing requirements')
        setIsLoading(false)
      }
    } catch (err: any) {
      setIsLoading(false)
      
      // Handle rate limiting
      if (err?.status === 429) {
        setError('Too many attempts. Please wait a moment and try again.')
        console.error('Rate limit hit - please wait before trying again')
      } else {
        setError('Failed to sign in with Google. Please try again.')
        console.error('Google Sign In Error:', err?.message || err?.toString() || 'Unknown error')
      }
      console.error('Error details:', err)
    }
  }, [router, startSSOFlow, isLoading])

  return (
    <View>
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading}
        className={`border-2 border-gray-200 rounded-xl py-4 shadow-sm ${
          isLoading ? 'bg-gray-100' : 'bg-white'
        }`}
        activeOpacity={0.8}
      >
        <View className="flex-row items-center justify-center">
          {isLoading ? (
            <Ionicons name="refresh" size={20} color="#9CA3AF" />
          ) : (
            <Ionicons name="logo-google" size={20} color="#EA4335" />
          )}
          <Text className={`font-semibold text-lg ml-3 ${
            isLoading ? 'text-gray-400' : 'text-gray-900'
          }`}>
            {isLoading ? 'Connecting...' : 'Continue with Google'}
          </Text>
        </View>
      </TouchableOpacity>
      
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3 flex-row items-center">
          <Ionicons name="alert-circle" size={18} color="#DC2626" />
          <Text className="text-red-600 text-sm ml-2 flex-1">
            {error}
          </Text>
        </View>
      )}
    </View>
  )
}