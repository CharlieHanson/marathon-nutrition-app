import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Image } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from '../../components/modals/ForgotPasswordModal';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAppleAuth, AppleSignInButton } from '../../hooks/useAppleAuth';

// Only allow internal paths (e.g. /meals, /(app)/dashboard). Reject protocol-relative or absolute URLs.
function isSafeRedirect(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return false;
  if (value.includes('//') || value.includes(':')) return false;
  return true;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const router = useRouter();
  const { signIn, user } = useAuth();
  const { promptAsync: signInWithGoogle, loading: googleLoading, error: googleError } = useGoogleAuth();
  const { signInWithApple, loading: appleLoading, error: appleError } = useAppleAuth();
  const params = useLocalSearchParams();
  const redirect = params?.redirect != null
    ? (Array.isArray(params.redirect) ? params.redirect[0] : params.redirect)
    : null;

  const safeRedirect = isSafeRedirect(redirect) ? redirect : null;

  // Redirect if already logged in — go to redirect param or index
  useEffect(() => {
    if (user) {
      router.replace(safeRedirect ?? '/');
    }
  }, [user, router, safeRedirect]);

  const handleSignIn = async () => {
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } = await signIn(email.trim(), password);

      if (signInError) {
        setError(signInError.message || 'Failed to sign in. Please check your credentials.');
        setLoading(false);
        return;
      }

      // If sign in successful, go to redirect param or index so it can run onboarding check
      if (data?.user) {
        router.replace(safeRedirect ?? '/');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const authBusy = loading || googleLoading || appleLoading;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.centerContent}>
        {/* Card Container */}
        <View style={styles.card}>
          {/* Logo and Heading */}
          <View style={styles.logoContainer}>
            <View style={styles.logoRow}>
              <Text style={styles.logoOrange}>Al</Text>
              <Text style={styles.logoGray}>imenta</Text>
            </View>
            <Text style={styles.subtitle}>
              Where nutrition meets performance
            </Text>
          </View>

          {/* Error Message */}
          {(error || googleError || appleError) ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error || googleError || appleError}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!authBusy}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!authBusy}
            />
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={() => setShowForgotPassword(true)} disabled={authBusy}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.primaryButton, authBusy && styles.primaryButtonDisabled]}
            onPress={handleSignIn}
            disabled={authBusy}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.buttonText, { marginLeft: 8 }]}>Please wait...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity disabled={authBusy}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Divider: or */}
          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          {/* Continue with Google */}
          <TouchableOpacity
            style={[styles.googleButton, authBusy && styles.googleButtonDisabled]}
            onPress={signInWithGoogle}
            disabled={authBusy}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#374151" />
                <Text style={[styles.googleButtonText, { marginLeft: 8 }]}>Signing in...</Text>
              </View>
            ) : (
              <>
                <Image source={require('../../assets/images/google_icon.jpg')} style={styles.googleIcon} resizeMode="contain" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Continue with Apple (iOS only) */}
          <View style={styles.appleButtonContainer}>
            {appleLoading ? (
              <View style={[styles.googleButton, styles.googleButtonDisabled]}>
                <ActivityIndicator size="small" color="#374151" />
                <Text style={[styles.googleButtonText, { marginLeft: 8 }]}>Signing in...</Text>
              </View>
            ) : (
              <AppleSignInButton
                onPress={signInWithApple}
                disabled={authBusy}
              />
            )}
          </View>
        </View>
      </View>

      <ForgotPasswordModal
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7ED', // orange-50
  },
  contentContainer: {
    flexGrow: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoOrange: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F6921D', // primary orange
  },
  logoGray: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937', // dark gray
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563', // gray-600
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2', // red-50
    borderWidth: 1,
    borderColor: '#FECACA', // red-200
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626', // red-600
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151', // gray-700
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB', // gray-300
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    color: '#111827', // gray-900
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#F6921D', // primary orange
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#F6921D', // primary orange
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#FB923C', // primary-400
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpText: {
    fontSize: 14,
    color: '#4B5563', // gray-600
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F6921D', // primary orange
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  googleButton: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  appleButtonContainer: {
    width: '100%',
    marginTop: 12,
  },
});

