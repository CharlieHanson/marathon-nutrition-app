// pages/_app.js
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import '../src/index.css';
import { AuthProvider } from '../src/context/AuthContext';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  /**
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Force router to refresh data when tab becomes visible
        router.replace(router.asPath);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]); */

  return (
    <AuthProvider>
      <Head>
        <link rel="icon" href="/favicon.ico?v=4" />
        <title>Alimenta</title>
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}