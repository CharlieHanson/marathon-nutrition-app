import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Image, LayoutAnimation, Platform, UIManager, KeyboardAvoidingView, Keyboard } from 'react-native';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from '../../components/modals/ForgotPasswordModal';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useAppleAuth, AppleSignInButton } from '../../hooks/useAppleAuth';
import { useTheme } from '../../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [showEmailForm, setShowEmailForm] = useState(false);
  const scrollRef = useRef(null);
  const scrollY = useRef(0);
  const hasNudgedForKeyboard = useRef(false);
  const router = useRouter();
  const { signIn, user } = useAuth();
  const { promptAsync: signInWithGoogle, loading: googleLoading, error: googleError } = useGoogleAuth();
  const { signInWithApple, loading: appleLoading, error: appleError } = useAppleAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
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

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      hasNudgedForKeyboard.current = false;
    });
    return () => sub.remove();
  }, []);

  const nudgeFieldsAboveKeyboard = () => {
    if (hasNudgedForKeyboard.current) return;
    hasNudgedForKeyboard.current = true;
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: scrollY.current + 90,
        animated: true,
      });
    }, 80);
  };

  const handleToggleEmailForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowEmailForm((prev) => !prev);
    setError('');
  };

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
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

            {/* Continue with Google */}
            <TouchableOpacity
              style={[styles.outlineButton, authBusy && styles.outlineButtonDisabled]}
              onPress={signInWithGoogle}
              disabled={authBusy}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color={colors.gray700} />
                  <Text style={[styles.outlineButtonText, { marginLeft: 8 }]}>Signing in...</Text>
                </View>
              ) : (
                <>
                  <Image source={require('../../assets/images/google_icon.jpg')} style={styles.googleIcon} resizeMode="contain" />
                  <Text style={styles.outlineButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Continue with Apple (iOS only) */}
            <View style={styles.appleButtonContainer}>
              {appleLoading ? (
                <View style={[styles.outlineButton, styles.outlineButtonDisabled]}>
                  <ActivityIndicator size="small" color={colors.gray700} />
                  <Text style={[styles.outlineButtonText, { marginLeft: 8 }]}>Signing in...</Text>
                </View>
              ) : (
                <AppleSignInButton
                  onPress={signInWithApple}
                  disabled={authBusy}
                  label="Continue with Apple"
                />
              )}
            </View>

            {/* Continue with Email */}
            <TouchableOpacity
              style={[styles.outlineButton, authBusy && styles.outlineButtonDisabled]}
              onPress={handleToggleEmailForm}
              disabled={authBusy}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineButtonText}>Continue with Email</Text>
            </TouchableOpacity>

            {/* Expanded email / password form */}
            {showEmailForm ? (
              <View style={styles.emailForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.placeholderColor}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={nudgeFieldsAboveKeyboard}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!authBusy}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.placeholderColor}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={nudgeFieldsAboveKeyboard}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!authBusy}
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                  />
                </View>

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
              </View>
            ) : null}

            {/* Forgot Password */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={() => setShowForgotPassword(true)} disabled={authBusy}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity disabled={authBusy}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>

      <ForgotPasswordModal
        visible={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
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
      paddingBottom: 40,
    },
    centerContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 48,
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
      backgroundColor: colors.errorLight,
      borderWidth: 1,
      borderColor: colors.errorBorder,
      borderRadius: 6,
      padding: 12,
      marginBottom: 16,
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
      backgroundColor: colors.background,
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
    forgotPasswordContainer: {
      alignItems: 'flex-end',
      marginTop: 4,
      marginBottom: 16,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: colors.primary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 16,
    },
    signUpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signUpText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    signUpLink: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  });
}
