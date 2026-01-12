
import React, { useState } from 'react';
import { GoogleIcon, SparklesIcon } from './Icons';
import type { User } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoggingIn(true);
    // Simulate a Google OAuth flow
    setTimeout(() => {
      const mockUser: User = {
        id: 'google-123',
        name: 'Auranut Explorer',
        email: 'hello@auranut.ai',
        photo: 'https://ui-avatars.com/api/?name=Auranut+Explorer&background=3b82f6&color=fff'
      };
      onLogin(mockUser);
      setIsLoggingIn(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background blobs for aesthetic appeal */}
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]"></div>

      <div className="w-full max-w-sm text-center z-10 space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-500/30 mb-2">
            <h1 className="text-4xl font-black text-white italic">A</h1>
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            AURANUT<span className="text-blue-500">.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg px-4 leading-relaxed">
            Your intelligent AI companion for a balanced health journey.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-white text-slate-700 py-4 px-6 rounded-2xl shadow-lg border border-slate-100 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="font-bold text-lg">Continue with Google</span>
          </button>
          
          <p className="text-xs text-slate-400 dark:text-slate-600 px-8">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <div className="pt-8 border-t dark:border-slate-800 grid grid-cols-2 gap-4">
          <div className="text-center space-y-1">
             <div className="flex justify-center text-blue-500"><SparklesIcon /></div>
             <p className="text-[10px] font-black uppercase text-slate-400">AI Powered</p>
          </div>
          <div className="text-center space-y-1">
             <div className="flex justify-center text-indigo-500"><SparklesIcon /></div>
             <p className="text-[10px] font-black uppercase text-slate-400">Smart Log</p>
          </div>
        </div>
      </div>
    </div>
  );
};
