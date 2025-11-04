import React, { useState } from 'react';
import { BookOpenIcon, UserIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from './IconComponents';
import Spinner from './Spinner';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Hardcoded credentials
    if (username === 'student@bar.exam' && password === 'pass2026') {
      onLoginSuccess();
    } else {
      setError('Invalid credentials. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel text-center p-6 md:p-12 rounded-3xl shadow-2xl shadow-black/30 animate-fade-in w-full max-w-md">
      <BookOpenIcon className="w-16 h-16 mx-auto text-brand-primary text-glow" />
      <h1 className="text-4xl font-black mt-4 mb-2 text-glow tracking-tight">Exam Bar 2026</h1>
      <p className="text-slate-400 mb-8">
        Please sign in to continue.
      </p>

      {error && (
        <div className="my-4 p-3 bg-red-900/40 border border-red-500/50 text-red-300 rounded-lg text-center animate-fade-in">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <UserIcon className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="email"
            id="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="select-embossed w-full text-lg p-3 pl-12 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
            placeholder="student@bar.exam"
            required
            aria-label="Email Address"
          />
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <LockClosedIcon className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="select-embossed w-full text-lg p-3 pl-12 pr-12 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
            placeholder="pass2026"
            required
            aria-label="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-300"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-primary hover:opacity-80 text-white font-bold py-4 px-10 rounded-lg text-lg transition-all transform hover:scale-105 shadow-glow-primary hover:shadow-glow-primary-lg disabled:opacity-50 disabled:cursor-wait disabled:shadow-none flex items-center justify-center"
        >
          {isLoading ? <Spinner size="sm" /> : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default LoginView;
