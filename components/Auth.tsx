import React, { useState } from 'react';
import { AuthView, User } from '../types';
import Button from './Button';
import { BookOpen, User as UserIcon, Lock, Mail } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>(AuthView.LOGIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication
    if (view === AuthView.LOGIN) {
      if (email && password) {
        onLogin({ email, name: email.split('@')[0] });
      }
    } else if (view === AuthView.SIGNUP) {
      if (email && password && name) {
        onLogin({ email, name });
      }
    } else {
      // Reset password flow
      alert(`Password reset link sent to ${email}`);
      setView(AuthView.LOGIN);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-4 border-black shadow-neobrutalism p-8 rounded-xl relative overflow-hidden">
        
        {/* Decorative circle */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary rounded-full border-4 border-black opacity-50 z-0"></div>

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-accent p-4 rounded-full border-4 border-black shadow-neobrutalism-sm">
              <BookOpen size={40} className="text-black" />
            </div>
          </div>

          <h2 className="text-3xl font-hand font-bold text-center mb-2 text-black">PDF to Notes Converter</h2>
          <p className="text-center text-black mb-8 font-sans font-medium">
            {view === AuthView.LOGIN ? 'Welcome back, Scholar!' : 
             view === AuthView.SIGNUP ? 'Start your learning journey' : 
             'Recover your account'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === AuthView.SIGNUP && (
              <div>
                <label className="block text-sm font-bold mb-1 ml-1 text-black">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-black" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-black placeholder-gray-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-1 ml-1 text-black">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-black" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-black placeholder-gray-500"
                  placeholder="student@college.edu"
                  required
                />
              </div>
            </div>

            {view !== AuthView.FORGOT_PASSWORD && (
              <div>
                <label className="block text-sm font-bold mb-1 ml-1 text-black">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-black" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all text-black placeholder-gray-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" fullWidth className="mt-6 text-black">
              {view === AuthView.LOGIN ? 'Login' : 
               view === AuthView.SIGNUP ? 'Create Account' : 
               'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2 text-black font-medium">
            {view === AuthView.LOGIN && (
              <>
                <p>New here? <button onClick={() => setView(AuthView.SIGNUP)} className="font-bold underline text-black hover:text-gray-700">Sign Up</button></p>
                <button onClick={() => setView(AuthView.FORGOT_PASSWORD)} className="text-black hover:underline">Forgot Password?</button>
              </>
            )}
            {view === AuthView.SIGNUP && (
              <p>Already have an account? <button onClick={() => setView(AuthView.LOGIN)} className="font-bold underline text-black hover:text-gray-700">Login</button></p>
            )}
            {view === AuthView.FORGOT_PASSWORD && (
              <p>Remembered? <button onClick={() => setView(AuthView.LOGIN)} className="font-bold underline text-black hover:text-gray-700">Back to Login</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;