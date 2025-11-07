import React, { useState } from 'react';
import { BookOpenIcon } from './IconComponents';
import Spinner from './Spinner';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    // Simulate network delay for Google Sign-In
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, this would be the result of the OAuth flow.
    // Here we just mock a successful login.
    try {
        const mockUser = {
            email: 'student@google.com',
            name: 'Bar Taker',
        };
        onLoginSuccess(mockUser);
    } catch (e) {
        setError('Google Sign-In failed. Please try again.');
        setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel text-center p-6 md:p-12 rounded-3xl shadow-2xl shadow-black/30 animate-fade-in w-full max-w-md">
      <BookOpenIcon className="w-16 h-16 mx-auto text-brand-primary text-glow" />
      <h1 className="text-4xl font-black mt-4 mb-2 text-glow tracking-tight">Exam Bar 2026</h1>
      <p className="text-slate-400 mb-8">
        Sign in with your Google account to continue.
      </p>

      {error && (
        <div className="my-4 p-3 bg-red-900/40 border border-red-500/50 text-red-300 rounded-lg text-center animate-fade-in">
          <p>{error}</p>
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full bg-white text-slate-700 font-semibold py-3 px-4 border border-slate-300 rounded-lg text-lg transition-all transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-wait disabled:shadow-none flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <Spinner size="sm" />
        ) : (
          <>
            <GoogleIcon className="w-6 h-6" />
            Sign in with Google
          </>
        )}
      </button>
      <p className="text-xs text-slate-500 mt-4">
        By signing in, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
};

export default LoginView;
