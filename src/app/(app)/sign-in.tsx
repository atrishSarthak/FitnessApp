import { useSignIn } from '@clerk/expo'
import { type Href, Link, useRouter } from 'expo-router'
import React from 'react'
import { Platform, Text, TextInput, View, KeyboardAvoidingView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons';
import GoogleSignIn from '../components/GoogleSignIn'

export default function Page() {
    const { signIn, errors, fetchStatus } = useSignIn()
    const router = useRouter()

    const [emailAddress, setEmailAddress] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [code, setCode] = React.useState('')
    const [isLoading, setIsLoading] = React.useState(false)
    const [errorMessage, setErrorMessage] = React.useState('')
    const [isResending, setIsResending] = React.useState(false)

    // Shared navigation logic
    const handleNavigation = React.useCallback(({ session, decorateUrl }: { 
        session?: { currentTask?: any } | null
        decorateUrl: (path: string) => string 
    }) => {
        if (session?.currentTask) {
            console.log(session?.currentTask)
            setIsLoading(false)
            return
        }

        const url = decorateUrl('/')
        router.push(url as Href)
    }, [router])

    // Email validation
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    // Form validation
    const validateForm = (): boolean => {
        if (!emailAddress.trim()) {
            setErrorMessage('Please enter your email address.')
            return false
        }

        if (!validateEmail(emailAddress)) {
            setErrorMessage('Please enter a valid email address.')
            return false
        }

        if (!password) {
            setErrorMessage('Please enter your password.')
            return false
        }

        if (password.length < 8) {
            setErrorMessage('Password must be at least 8 characters long.')
            return false
        }

        return true
    }

    const handleSubmit = async () => {
        setErrorMessage('')

        // Validate form before submission
        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            const { error } = await signIn.password({
                emailAddress,
                password,
            })

            if (error) {
                setIsLoading(false)
                setErrorMessage(error.message || 'Invalid email or password. Please try again.')
                return
            }

            if (signIn.status === 'complete') {
                await signIn.finalize({
                    navigate: handleNavigation,
                })
            } else if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
                const emailCodeFactor = signIn.supportedSecondFactors.find(
                    (factor) => factor.strategy === 'email_code',
                )

                if (emailCodeFactor) {
                    await signIn.mfa.sendEmailCode()
                }
                setIsLoading(false)
            } else {
                setIsLoading(false)
                setErrorMessage('Unable to sign in. Please try again.')
            }
        } catch (error) {
            setIsLoading(false)
            console.error('Sign-in error:', error)
            setErrorMessage('Network error. Please check your connection and try again.')
        }
    }

    const handleResendCode = async () => {
        if (isResending) return
        
        setIsResending(true)
        try {
            await signIn.mfa.sendEmailCode()
            // Optional: Show success message
        } catch (error) {
            console.error('Resend error:', error)
            setErrorMessage('Failed to resend code. Please try again.')
        } finally {
            setTimeout(() => setIsResending(false), 3000) // 3 second cooldown
        }
    }

    const handleVerify = async () => {
        try {
            await signIn.mfa.verifyEmailCode({ code })

            if (signIn.status === 'complete') {
                await signIn.finalize({
                    navigate: handleNavigation,
                })
            } else {
                setErrorMessage('Verification incomplete. Please try again.')
            }
        } catch (error) {
            console.error('Verification error:', error)
            setErrorMessage('Failed to verify code. Please try again.')
        }
    }

    if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
        return (
            <SafeAreaView className="flex-1 p-5">
                <View className="flex-1 justify-center px-6">
                    <View className="items-center mb-8">
                        <Text className="text-2xl font-bold text-gray-900 mb-4">
                            Verify your account
                        </Text>
                    </View>

                    <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                        <TextInput
                            value={code}
                            placeholder="Enter your verification code"
                            placeholderTextColor="#9CA3AF"
                            onChangeText={(code) => setCode(code)}
                            keyboardType="numeric"
                            className="bg-gray-50 rounded-xl px-4 py-4 border border-gray-200 text-gray-900 text-center text-lg"
                        />
                        {errors.fields.code && (
                            <Text className="text-red-600 text-sm mt-2 text-center">
                                {errors.fields.code.message}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={handleVerify}
                        disabled={fetchStatus === 'fetching'}
                        className={`rounded-xl py-4 shadow-sm mb-4 ${fetchStatus === 'fetching' ? 'bg-gray-400' : 'bg-blue-600'
                            }`}
                        activeOpacity={0.8}
                    >
                        <Text className="text-white font-semibold text-lg text-center">
                            {fetchStatus === 'fetching' ? 'Verifying...' : 'Verify'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleResendCode}
                        disabled={isResending}
                        className="py-4"
                        activeOpacity={0.7}
                    >
                        <Text className={`font-semibold text-center ${isResending ? 'text-gray-400' : 'text-blue-600'}`}>
                            {isResending ? 'Sending...' : 'I need a new code'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className='flex-1'>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className='flex-1'
            >
                <View className="flex-1 px-6 justify-between">
                    {/* Main Content */}
                    <View className="flex-1 justify-center">
                        {/* Logo/Branding */}
                        <View className="items-center mb-8">
                            <View className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl items-center justify-center mb-4 shadow-lg">
                                <Ionicons name="fitness" size={40} color="white" />
                            </View>

                            <Text className="text-3xl font-bold text-gray-900 mb-2">
                                Caliber
                            </Text>

                            <Text className="text-lg text-gray-600 text-center">
                                Track your fitness journey{"\n"}and reach your goals
                            </Text>
                        </View>

                        {/* Sign in form */}
                        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                            <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                Welcome Back
                            </Text>

                            {/* Error Message */}
                            {errorMessage ? (
                                <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex-row items-center">
                                    <Ionicons name="alert-circle" size={20} color="#DC2626" />
                                    <Text className="text-red-600 text-sm ml-2 flex-1">
                                        {errorMessage}
                                    </Text>
                                </View>
                            ) : null}

                            {/* Email Input */}
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </Text>

                                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                                    <Ionicons name="mail-outline" size={20} color="#6B7280" />

                                    <TextInput
                                        autoCapitalize="none"
                                        value={emailAddress}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#9CA3AF"
                                        onChangeText={setEmailAddress}
                                        className="flex-1 ml-3 text-gray-900"
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>

                            {/* Password Input */}
                            <View className="mb-6">
                                <Text className="text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </Text>

                                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />

                                    <TextInput
                                        value={password}
                                        placeholder="Enter your password"
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={true}
                                        onChangeText={setPassword}
                                        className="flex-1 ml-3 text-gray-900"
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isLoading}
                            className={`rounded-xl py-4 shadow-sm mb-4 ${isLoading ? "bg-gray-400" : "bg-blue-600"
                                }`}
                            activeOpacity={0.8}
                        >
                            <View className="flex-row items-center justify-center">
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="log-in-outline" size={20} color="white" />
                                )}

                                <Text className="text-white font-semibold text-lg ml-2">
                                    {isLoading ? "Signing In..." : "Sign In"}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View className="flex-row items-center my-4">
                            <View className="flex-1 h-px bg-gray-200" />
                            <Text className="px-4 text-gray-500 text-sm">or</Text>
                            <View className="flex-1 h-px bg-gray-200" />
                        </View>

                        {/* Google Sign In Button */}
                        <GoogleSignIn />
                    </View>

                    {/* Sign Up Link */}
                    <View className="flex-row justify-center items-center">
                        <Text className="text-gray-600">Don't have an account? </Text>

                        <Link href="/sign-up" asChild>
                            <TouchableOpacity>
                                <Text className="text-blue-600 font-semibold">Sign Up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {/* Footer section - Always at bottom */}
                    <View className="pb-6">
                        <Text className="text-center text-gray-500 text-sm">
                            Start your fitness journey today
                        </Text>
                    </View>

                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}