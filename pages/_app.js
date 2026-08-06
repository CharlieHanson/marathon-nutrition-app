// pages/_app.js
import Head from 'next/head';
import { useEffect } from 'react';
import '../src/index.css';
import { AuthProvider } from '../src/context/AuthContext';
import { initPostHog } from '../src/lib/posthog';
import { TooltipProvider } from '../src/components/ui/tooltip';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <AuthProvider>
      <TooltipProvider delayDuration={200}>
        <Head>
          <link rel="icon" href="/favicon.ico?v=4" />
          <title>Alimenta</title>
        </Head>
        <Component {...pageProps} />
      </TooltipProvider>
    </AuthProvider>
  );
}
