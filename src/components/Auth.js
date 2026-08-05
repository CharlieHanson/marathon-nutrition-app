import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Briefcase, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';
import { capture } from '../lib/posthog';
import { PageDecor } from './shared/PageDecor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/shared/Button';
import { Input } from '@/src/components/shared/Input';
import { Card } from '@/src/components/shared/Card';


const Auth = ({ presetRole }) => {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  
  // Forgot password modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetPending, setResetPending] = useState(false);

  const [role, setRole] = useState(presetRole || 'client');
  useEffect(() => {
    if (presetRole) return;
    const urlRole = router.query.role;
    if (urlRole === 'nutritionist' || router.pathname.startsWith('/pro')) {
      setRole('nutritionist');
    } else {
      setRole('client');
    }
  }, [router.query.role, router.pathname, presetRole]);

  const backHref =
    (presetRole === 'nutritionist') ||
    router.pathname.startsWith('/pro') ||
    router.query.role === 'nutritionist'
      ? '/pro'
      : '/';

  const { signIn, signUp, enableGuestMode } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPending(true);

    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your name');

        const metadata =
          role === 'nutritionist' && businessName.trim()
            ? { name, role, is_new_user: true, business_name: businessName }
            : { name, role, is_new_user: true };

        const { error } = await signUp(email, password, name, role, metadata);
        if (error) throw error;
        capture('signup_completed', {
          persona: role === 'nutritionist' ? 'nutritionist' : 'athlete',
        });
        
        if (typeof window !== 'undefined') {
          window.alert('Account created! Please check your email to verify your account.');
        }

        const nextLogin = role === 'nutritionist' ? '/pro/login' : '/login';
        router.replace(`${nextLogin}?created=1`);
        return;
      }

      // 🔽 LOGIN PATH (NEW)
      const { error } = await signIn(email, password);
      if (error) throw error;

      console.log('Auth: signIn successful, sending to /auth/redirect');
      router.replace('/auth/redirect');
      return;

    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  };


  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    setResetPending(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      
      if (error) throw error;
      
      setResetMessage('✅ Password reset email sent! Check your inbox.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetMessage('');
      }, 3000);
    } catch (err) {
      setResetMessage(`❌ ${err.message}`);
    } finally {
      setResetPending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/redirect`,
      },
    });
  
    if (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const handleGuest = () => enableGuestMode();

  const isNutritionist = role === 'nutritionist';
  const heading = isNutritionist ? 'Nutritionist Portal' : 'Where nutrition meets performance';
  const submitText = isNutritionist
    ? (isSignUp ? 'Create Nutritionist Account' : 'Sign In')
    : (isSignUp ? 'Sign Up' : 'Sign In');

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
      <PageDecor />

      {/* Back link */}
      <div className="absolute left-4 top-4 z-20">
        <Link href={backHref} className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card>
          <div className="text-center mb-6">
            <span className="brand-wordmark block text-4xl mb-4" aria-label="Alimenta">
              <span className="text-primary">Al</span>
              <span className="text-gray-800">imenta</span>
            </span>
            <p className="text-xl text-foreground mt-2">{heading}</p>
            {isNutritionist && (
              <p className="text-sm text-muted-foreground mt-1">Manage your clients&apos; nutrition plans</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <Input
                id="name"
                label={isNutritionist ? 'Your Name' : 'Name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isNutritionist ? 'Jane Smith' : 'Enter your name'}
                required
              />
            )}

            {isSignUp && isNutritionist && (
              <Input
                id="businessName"
                label="Business Name"
                helperText="Optional"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Smith Nutrition Consulting"
              />
            )}

            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <div className="space-y-2">
              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength="6"
                required
              />
              {!isSignUp && (
                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowForgotPassword(true)}
                    className="h-auto p-0 text-sm"
                  >
                    Forgot password?
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={pending}
              variant="primary"
              className="w-full"
              icon={isNutritionist ? Briefcase : User}
            >
              {pending ? 'Please wait...' : submitText}
            </Button>

            <Button
              type="button"
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full border-border bg-cream-200 hover:bg-cream-300 text-foreground border"
            >
              <img src="/google_icon.jpg" alt="" className="w-5 h-5 object-contain" />
              Continue with Google
            </Button>

            <div className="text-center text-sm space-y-2">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setBusinessName('');
                }}
                className="w-full"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <Dialog
        open={showForgotPassword}
        onOpenChange={(open) => {
          if (!open) {
            setShowForgotPassword(false);
            setResetEmail('');
            setResetMessage('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <Input
              id="resetEmail"
              label="Email Address"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            {resetMessage && (
              <div
                className={`p-3 rounded-md text-sm ${
                  resetMessage.includes('✅')
                    ? 'bg-green-50 text-green-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {resetMessage}
              </div>
            )}

            <DialogFooter className="gap-3 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setResetMessage('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={resetPending}
              >
                {resetPending ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
