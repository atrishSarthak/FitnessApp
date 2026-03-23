import { useAuth, useSignUp } from '@clerk/expo'
import { type Href, Link, useRouter } from 'expo-router'
import React from 'react'
import { Text, TextInput, View, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons';


export default function Page() {
    const { signUp, errors, fetchStatus } = useSignUp()
    const { isSignedIn } = useAuth()
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
            setErrorMessage('Please enter a password.')
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
            const { error } = await signUp.password({
                emailAddress,
                password,
            })

            if (error) {
                setIsLoading(false)
                setErrorMessage(error.message || 'Unable to create account. Please try again.')
                return
            }

            await signUp.verifications.sendEmailCode()
            setIsLoading(false)
        } catch (error) {
            setIsLoading(false)
            console.error('Sign-up error:', error)
            setErrorMessage('Network error. Please check your connection and try again.')
        }
    }

    const handleBackToSignUp = () => {
        // Reset the sign-up state to go back to the form
        setCode('')
        setErrorMessage('')
        signUp.reset()
    }

    const handleResendCode = async () => {
        if (isResending) return
        
        setIsResending(true)
        try {
            await signUp.verifications.sendEmailCode()
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
            await signUp.verifications.verifyEmailCode({
                code,
            })

            if (signUp.status === 'complete') {
                await signUp.finalize({
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

    if (signUp.status === 'complete' || isSignedIn) {
        return null
    }

    if (
        signUp.status === 'missing_requirements' &&
        signUp.unverifiedFields.includes('email_address') &&
        signUp.missingFields.length === 0
    ) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                >
                    {/* Back Button */}
                    <View className="px-6 pt-4">
                        <TouchableOpacity
                            onPress={handleBackToSignUp}
                            className="flex-row items-center"
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color="#374151" />
                            <Text className="text-gray-700 font-semibold ml-2">Back to Sign Up</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-1 px-6 justify-between">
                        {/* Main Content */}
                        <View className="flex-1 justify-center">
                            {/* Logo/Branding */}
                            <View className="items-center mb-8">
                                <View className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl items-center justify-center mb-4 shadow-lg">
                                    <Ionicons name="mail-unread" size={40} color="white" />
                                </View>

                                <Text className="text-3xl font-bold text-gray-900 mb-2">
                                    Check Your Email
                                </Text>

                                <Text className="text-lg text-gray-600 text-center">
                                    We sent a verification code to{"\n"}
                                    <Text className="font-semibold text-gray-900">{emailAddress}</Text>
                                </Text>
                            </View>

                            {/* Verification Form Card */}
                            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                                <Text className="text-sm font-medium text-gray-700 mb-2 text-center">
                                    Verification Code
                                </Text>
                                
                                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                                    <Ionicons name="key-outline" size={20} color="#6B7280" />
                                    
                                    <TextInput
                                        value={code}
                                        placeholder="Enter 6-digit code"
                                        placeholderTextColor="#9CA3AF"
                                        onChangeText={(code) => setCode(code)}
                                        keyboardType="numeric"
                                        maxLength={6}
                                        className="flex-1 ml-3 text-gray-900 text-center text-2xl font-semibold tracking-widest"
                                    />
                                </View>
                                {errors.fields.code && (
                                    <Text className="text-red-600 text-sm mt-2 text-center">
                                        {errors.fields.code.message}
                                    </Text>
                                )}
                            </View>

                            {/* Verify Button */}
                            <TouchableOpacity
                                onPress={handleVerify}
                                disabled={fetchStatus === 'fetching'}
                                className={`rounded-xl py-4 shadow-sm mb-4 ${
                                    fetchStatus === 'fetching' ? 'bg-gray-400' : 'bg-blue-600'
                                }`}
                                activeOpacity={0.8}
                            >
                                <View className="flex-row items-center justify-center">
                                    {fetchStatus === 'fetching' ? (
                                        <Ionicons name="refresh" size={20} color="white" />
                                    ) : (
                                        <Ionicons name="checkmark-circle" size={20} color="white" />
                                    )}
                                    <Text className="text-white font-semibold text-lg ml-2">
                                        {fetchStatus === 'fetching' ? 'Verifying...' : 'Verify Email'}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Resend Code */}
                            <TouchableOpacity
                                onPress={handleResendCode}
                                disabled={isResending}
                                className="py-3"
                                activeOpacity={0.7}
                            >
                                <Text className={`font-semibold text-center ${isResending ? 'text-gray-400' : 'text-blue-600'}`}>
                                    {isResending ? 'Sending...' : "Didn't receive the code? Resend"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <View className="pb-6">
                            <Text className="text-center text-gray-500 text-sm">
                                Check your spam folder if you don't see the email
                            </Text>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50'>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className='flex-1'
            >
                <View className='flex-1 px-6 justify-between'>
                    {/* Main Content */}
                    <View className='flex-1 justify-center'>
                        {/* Logo/Branding */}
                        <View className="items-center mb-8">
                            <View className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl items-center justify-center mb-4 shadow-lg">
                                <Ionicons name="fitness" size={40} color="white" />
                            </View>

                            <Text className="text-3xl font-bold text-gray-900 mb-2">
                                Join Caliber
                            </Text>

                            <Text className="text-lg text-gray-600 text-center">
                                Start your fitness journey{"\n"}and achieve your goals
                            </Text>
                        </View>

                        {/* Error Message */}
                        {errorMessage ? (
                            <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex-row items-center">
                                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                                <Text className="text-red-600 text-sm ml-2 flex-1">
                                    {errorMessage}
                                </Text>
                            </View>
                        ) : null}

                        {/* Sign Up Form Card */}
                        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                                Create Your Account
                            </Text>

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
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color="#6B7280"
                                    />

                                    <TextInput
                                        value={password}
                                        placeholder="Create a password"
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={true}
                                        onChangeText={setPassword}
                                        className="flex-1 ml-3 text-gray-900"
                                        editable={!isLoading}
                                    />
                                </View>

                                <Text className="text-xs text-gray-500 mt-1">
                                    Must be at least 8 characters
                                </Text>
                            </View>

                            {/* Sign Up Button */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={isLoading}
                                className={`rounded-xl py-4 shadow-sm mb-4 ${isLoading ? "bg-gray-400" : "bg-blue-600"
                                    }`}
                                activeOpacity={0.8}
                            >
                                <View className="flex-row items-center justify-center">
                                    {isLoading ? (
                                        <Ionicons name="refresh" size={20} color="white" />
                                    ) : (
                                        <Ionicons
                                            name="person-add-outline"
                                            size={20}
                                            color="white"
                                        />
                                    )}

                                    <Text className="text-white font-semibold text-lg ml-2">
                                        {isLoading ? "Creating Account..." : "Create Account"}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Terms and Privacy */}
                            <Text className="text-xs text-gray-500 text-center">
                                By signing up, you agree to our{' '}
                                <Text className="text-blue-600">Terms of Service</Text>
                                {' '}and{' '}
                                <Text className="text-blue-600">Privacy Policy</Text>
                            </Text>
                        </View>
                    </View>

                    {/* Footer - Always at bottom */}
                    <View className="pb-6">
                        <View className="flex-row justify-center items-center mb-4">
                            <Text className="text-gray-600">Already have an account? </Text>
                            <Link href="/sign-in">
                                <Text className="text-blue-600 font-semibold">Sign in</Text>
                            </Link>
                        </View>
                        
                        <Text className="text-center text-gray-500 text-sm">
                            Ready to transform your fitness?
                        </Text>
                    </View>

                </View>

                {/* Required for sign-up flows. Clerk's bot sign-up protection is enabled by default */}
                <View nativeID="clerk-captcha" />
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}