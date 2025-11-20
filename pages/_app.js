// pages/_app.js
import Head from 'next/head';
import '../src/index.css';
import { AuthProvider } from '../src/context/AuthContext';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Head>
        {/* favicon(s) */}
        <link rel="icon" href="/favicon.ico?v=4" />
        {/* optional extras while testing */}
        {/* <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=4" /> */}
        {/* <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=4" /> */}
        <title>Alimenta</title>
      </Head>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
