import { ArrowLeft, Facebook, Mail, Lock, User, Phone, Calendar } from 'lucide-react';
import { GoToType } from '../types';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useState } from 'react';
import React from 'react';

export function Signup({ goTo, setUserLocation }: { goTo: GoToType, setUserLocation: (l: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !name || !phone || !age) {
      setError('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name,
        email,
        phone,
        age: parseInt(age),
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      // After this, App.tsx will navigate home automatically due to auth state change.
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please sign in instead.');
      } else if (e.code === 'auth/operation-not-allowed') {
        setError('Email/Password is not enabled in Firebase. Please enable it in Firebase Console -> Authentication -> Sign-in method.');
      } else {
        setError(e.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/operation-not-allowed') {
        alert('Google login is not enabled in Firebase. Please enable it in Firebase Console.');
      } else {
        alert('Signup failed. Please try again.');
      }
    }
  };

  const handleFacebookSignup = async () => {
    try {
      const provider = new FacebookAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/operation-not-allowed') {
        alert('Facebook login is not enabled in Firebase. Please enable it in Firebase Console -> Authentication -> Sign-in method.');
      } else {
        alert('Signup with Facebook failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-brand-blue to-brand-teal px-6 py-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <button onClick={() => goTo('login', true)} className="flex items-center gap-1.5 text-white/90 text-sm font-semibold mb-6 active:opacity-70 transition-opacity">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-[32px] leading-none">
            ✨
          </div>
          <h1 className="text-3xl font-black text-white font-nunito mb-2">Create Account</h1>
          <p className="text-white/80 text-sm">Join us for a better healthcare experience</p>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-xl w-full flex flex-col items-center">
          <form onSubmit={handleEmailSignup} className="w-full space-y-4 mb-6">
            {error && <div className="p-3 bg-red-50 text-red-500 rounded-xl text-sm">{error}</div>}
            
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-text-muted mb-1.5">Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter mobile number" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all"
                    required
                  />
                </div>
              </div>

              <div className="w-1/3">
                <label className="block text-xs font-bold text-text-muted mb-1.5">Age</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted mb-1.5">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-teal text-white rounded-xl py-3.5 font-bold flex justify-center items-center gap-2 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-brand-blue shadow-lg shadow-brand-teal/30 disabled:opacity-70"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="w-full relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">OR</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="w-full space-y-4">
            <button 
              type="button"
              onClick={handleGoogleSignup}
              className="w-full bg-white text-slate-700 border border-slate-200 rounded-xl py-3.5 font-bold flex justify-center items-center gap-3 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-brand-teal shadow-sm hover:bg-slate-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign Up with Google
            </button>

            <button 
              type="button"
              onClick={handleFacebookSignup}
              className="w-full bg-[#1877F2] text-white rounded-xl py-3.5 font-bold flex justify-center items-center gap-3 active:scale-95 transition-all outline-none focus:ring-2 focus:ring-brand-teal shadow-sm hover:bg-[#1877F2]/90"
            >
              <Facebook className="w-5 h-5 fill-current border-none" />
              Sign Up with Facebook
            </button>
          </div>
          
          <p className="text-center text-[11px] text-text-muted mt-5 font-medium leading-relaxed max-w-[200px]">
            By signing up, you agree to our Terms of Service & Privacy Policy.
          </p>

          <div className="mt-6 text-center border-t border-slate-100 pt-5 w-full">
            <p className="text-sm border-slate-200 text-text-muted">
              Already have an account?{' '}
              <button onClick={() => goTo('login')} className="text-brand-teal font-bold">Sign In</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
