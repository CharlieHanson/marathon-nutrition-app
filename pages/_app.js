import { AuthProvider } from '../src/context/AuthContext';
import '../src/index.css'; // Import your global styles

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;