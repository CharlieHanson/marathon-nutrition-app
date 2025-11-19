import dynamic from 'next/dynamic';

// Avoid SSR warnings if Auth touches window
const Auth = dynamic(() => import('../components/Auth'), { ssr: false });

export default function LoginPage() {
  return <Auth />;
}
