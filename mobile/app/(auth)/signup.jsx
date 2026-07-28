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
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAppleAuth, AppleSignInButton } from '../../hooks/useAppleAuth';
import { capture } from '../../lib/analytics';
import { usePostHog } from 'posthog-react-native';
import { useTheme } from '../../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const router = useRouter();
  const posthog = usePostHog();
  const { user } = useAuth();
  const { signUp } = useAuth();
  const { promptAsync: signInWithGoogle, loading: googleLoading, error: googleError } = useGoogleAuth();
  const { signInWithApple, loading: appleLoading, error: appleError } = useAppleAuth();

  const handleToggleEmailForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowEmailForm((prev) => !prev);
    setError('');
  };

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
      capture(posthog, 'signup_completed', { persona: 'athlete' });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      router.replace('/');
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
                  <Ionicons name="checkmark-circle" size={64} color={colors.success} />
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
                {/* Logo and Heading */}
                <View style={styles.logoContainer}>
                  <View style={styles.logoRow}>
                    <Text style={styles.logoOrange}>Al</Text>
                    <Text style={styles.logoGray}>imenta</Text>
                  </View>
                  <Text style={styles.subtitle}>
                    Welcome! Create your account to get started
                  </Text>
                </View>

                {/* Error Message */}
                {(error || googleError || appleError) ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error || googleError || appleError}</Text>
                  </View>
                ) : null}

                {/* Sign up with Google */}
                <TouchableOpacity
                  style={[styles.outlineButton, authBusy && styles.outlineButtonDisabled]}
                  onPress={signInWithGoogle}
                  disabled={authBusy}
                  activeOpacity={0.8}
                >
                  {googleLoading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator size="small" color={colors.gray700} />
                      <Text style={[styles.outlineButtonText, { marginLeft: 8 }]}>Signing up...</Text>
                    </View>
                  ) : (
                    <>
                      <Image source={require('../../assets/images/google_icon.jpg')} style={styles.googleIcon} resizeMode="contain" />
                      <Text style={styles.outlineButtonText}>Sign up with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Sign up with Apple (iOS only) */}
                <View style={styles.appleButtonContainer}>
                  {appleLoading ? (
                    <View style={[styles.outlineButton, styles.outlineButtonDisabled]}>
                      <ActivityIndicator size="small" color={colors.gray700} />
                      <Text style={[styles.outlineButtonText, { marginLeft: 8 }]}>Signing up...</Text>
                    </View>
                  ) : (
                    <AppleSignInButton
                      onPress={signInWithApple}
                      disabled={authBusy}
                      label="Sign up with Apple"
                    />
                  )}
                </View>

                {/* Sign up with Email */}
                <TouchableOpacity
                  style={[styles.outlineButton, authBusy && styles.outlineButtonDisabled]}
                  onPress={handleToggleEmailForm}
                  disabled={authBusy}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineButtonText}>Sign up with Email</Text>
                </TouchableOpacity>

                {/* Expanded name / email / password form */}
                {showEmailForm ? (
                  <View style={styles.emailForm}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        placeholderTextColor={colors.placeholderColor}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoCorrect={false}
                        editable={!authBusy}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Email</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.placeholderColor}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        editable={!authBusy}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Password</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password (min. 6 characters)"
                        placeholderTextColor={colors.placeholderColor}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!authBusy}
                      />
                      <Text style={styles.helperText}>Password must be at least 6 characters</Text>
                    </View>

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
                  </View>
                ) : null}

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

                {/* Divider */}
                <View style={styles.divider} />

                {/* Login Link */}
                <View style={styles.signInContainer}>
                  <Text style={styles.signInText}>Already have an account? </Text>
                  <Link href="/(auth)/login" asChild>
                    <TouchableOpacity disabled={authBusy}>
                      <Text style={styles.signInLink}>Sign In</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 32,
      shadowColor: colors.shadowColor,
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
      color: colors.primary,
    },
    logoGray: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    errorContainer: {
      marginBottom: 16,
      padding: 12,
      backgroundColor: colors.errorLight,
      borderWidth: 1,
      borderColor: colors.errorBorder,
      borderRadius: 6,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
    },
    outlineButton: {
      width: '100%',
      minHeight: 44,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 6,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.borderDark,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 12,
    },
    outlineButtonDisabled: {
      opacity: 0.7,
    },
    outlineButtonText: {
      color: colors.gray700,
      fontSize: 15,
      fontWeight: '600',
      includeFontPadding: false,
    },
    googleIcon: {
      width: 20,
      height: 20,
    },
    appleButtonContainer: {
      width: '100%',
      marginBottom: 12,
    },
    emailForm: {
      marginTop: 4,
      marginBottom: 4,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.gray700,
      marginBottom: 8,
    },
    input: {
      width: '100%',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.borderDark,
      borderRadius: 6,
      backgroundColor: colors.inputBackground,
      color: colors.text,
      fontSize: 16,
    },
    helperText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    primaryButton: {
      width: '100%',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 6,
      backgroundColor: colors.primary,
      marginBottom: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonDisabled: {
      opacity: 0.7,
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
    legalText: {
      marginTop: 8,
      marginBottom: 16,
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    legalLink: {
      color: colors.primary,
      fontWeight: '600',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 16,
    },
    signInContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signInText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    signInLink: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    successIconWrap: {
      alignItems: 'center',
      marginBottom: 20,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    successMessage: {
      fontSize: 15,
      color: colors.textSecondary,
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
      color: colors.primary,
    },
  });
}
