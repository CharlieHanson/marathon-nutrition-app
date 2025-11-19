// pages/_app.js
import '../src/index.css'; // or global styles
import { AuthProvider } from '../src/context/AuthContext';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
