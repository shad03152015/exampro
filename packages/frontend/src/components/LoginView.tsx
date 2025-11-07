import React, { useState, useEffect, useRef } from 'react';
import { BookOpenIcon } from './IconComponents';
import { authAPI } from '../services/api';

// Declare global types for Google Sign-In
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Simple inline SVG for Google icon
const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 48 48" {...props}>
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691c-1.229 2.503-1.939 5.316-1.939 8.309c0 3.011.722 5.834 1.965 8.353l6.54-5.011c-.53-1.579-.832-3.264-.832-5.013c0-1.741.29-3.415.81-4.965l-6.55-5.025z" />
        <path fill="#4CAF50" d="M24 48c5.166 0 9.86-1.977 13.409-5.192l-6.19-4.819C28.987 40.23 26.616 41 24 41c-5.225 0-9.655-3.118-11.28-7.48l-6.522 5.025C9.505 43.136 16.21 48 24 48z" />
        <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 4.819c3.557-3.224 5.99-7.931 5.99-13.39c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);

interface LoginViewProps {
  onLoginSuccess: (user: { email: string; name: string }) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Load Google Sign-In script and initialize on component mount
  useEffect(() => {
    const loadGoogleScript = () => {
      return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (window.google) {
          resolve(window.google);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
        document.head.appendChild(script);
      });
    };

    loadGoogleScript()
      .then(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId || clientId === 'your-google-client-id-here') {
          setError('Google OAuth is not properly configured. Please contact the administrator.');
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            try {
              setError(null);

              // Authenticate with backend using the ID token
              const authResponse = await authAPI.googleAuth(response.credential);

              // Store JWT token
              localStorage.setItem('auth_token', authResponse.token);

              // Check for existing session
              const sessionKey = `examPractice2026_active_session_${authResponse.user.email}`;
              if (sessionStorage.getItem(sessionKey)) {
                setError('This account is already logged in another session. Please close the other session to continue.');
                return;
              }

              // Success - call the success callback
              onLoginSuccess(authResponse.user);
            } catch (error) {
              console.error('Sign-In callback error:', error);
              setError(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
            }
          },
        });

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
          });
        }
      })
      .catch(() => {
        setError('Google authentication unavailable. Please refresh the page and try again.');
      });
  }, [onLoginSuccess]);

  return (
    <div className="glass-panel text-center p-6 md:p-12 rounded-3xl shadow-2xl shadow-black/30 animate-fade-in w-full max-w-md">
      <BookOpenIcon className="w-16 h-16 mx-auto text-brand-primary text-glow" />
      <h1 className="text-4xl font-black mt-4 mb-2 text-glow tracking-tight">Exam Practice for 2026 Bar Examination</h1>
      <p className="text-slate-400 mb-8">
        Sign in with your Google account to continue.
      </p>

      {error && (
        <div className="my-4 p-3 bg-red-900/40 border border-red-500/50 text-red-300 rounded-lg text-center animate-fade-in">
          <p>{error}</p>
        </div>
      )}

      <div ref={googleButtonRef}></div>
      <p className="text-xs text-slate-500 mt-4">
        By signing in, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
};

export default LoginView;
