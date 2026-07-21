import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAppleAuth, AppleSignInButton } from '../../hooks/useAppleAuth';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const { user } = useAuth();
  const { signUp } = useAuth();
  const { promptAsync: signInWithGoogle, loading: googleLoading, error: googleError } = useGoogleAuth();
  const { signInWithApple, loading: appleLoading, error: appleError } = useAppleAuth();

  const handleSignUp = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await signUp(
        email.trim(),
        password,
        name.trim(),
        'client'
      );

      if (signUpError) {
        setError(signUpError.message || 'Failed to create account. Please try again.');
        setLoading(false);
        return;
      }

      // Check if email already exists (Supabase returns empty identities array)
      if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists. Please log in instead.');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      router.replace('/(app)');
    }
  }, [user, router]);

  const authBusy = loading || googleLoading || appleLoading;

  const openLegalUrl = async (path) => {
    const url = `https://alimentanutrition.com${path}`;
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Error opening legal URL:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContainer}>
          <View style={styles.card}>
            {success ? (
              <>
                <View style={styles.successIconWrap}>
                  <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
                </View>
                <Text style={styles.successTitle}>Check Your Email</Text>
                <Text style={styles.successMessage}>
                  We sent a verification link to {email}. Click the link to activate your account.
                </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity style={styles.backToLoginWrap} activeOpacity={0.7}>
                    <Text style={styles.backToLoginText}>Back to Login</Text>
                  </TouchableOpacity>
                </Link>
              </>
            ) : (
              <>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>Create Account</Text>
                  <Text style={styles.subtitle}>Sign up to get started</Text>
                </View>

                {/* Error Message */}
                {(error || googleError || appleError) ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error || googleError || appleError}</Text>
                  </View>
                ) : null}

                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!authBusy}
                  />
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
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
                    placeholder="Enter your password (min. 6 characters)"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!authBusy}
                  />
                  <Text style={styles.helperText}>Password must be at least 6 characters</Text>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, authBusy && styles.primaryButtonDisabled]}
                  onPress={handleSignUp}
                  disabled={authBusy}
                >
                  {loading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={[styles.buttonText, { marginLeft: 8 }]}>Creating account...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                  )}
                </TouchableOpacity>

                {/* Login Link */}
                <View style={styles.signInContainer}>
                  <Text style={styles.signInText}>Already have an account? </Text>
                  <Link href="/(auth)/login" asChild>
                    <TouchableOpacity>
                      <Text style={styles.signInLink}>Sign In</Text>
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

                <Text style={styles.legalText}>
                  By continuing, you agree to our{' '}
                  <Text
                    style={styles.legalLink}
                    onPress={() => openLegalUrl('/terms')}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={styles.legalLink}
                    onPress={() => openLegalUrl('/privacy')}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7ED',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  innerContainer: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    minHeight: '100%',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
  },
  errorContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F6921D',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#FB923C',
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
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    color: '#4B5563',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F6921D',
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
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  legalText: {
    marginTop: 16,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  legalLink: {
    color: '#F6921D',
    fontWeight: '600',
  },
  // Success state
  successIconWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backToLoginWrap: {
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F6921D',
  },
});