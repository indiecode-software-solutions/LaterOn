import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { triggerSelection } from './haptics';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    triggerSelection();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        triggerSelection();
        localStorage.setItem('token', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        triggerSelection();
        // After signup, switch to login
        setIsLogin(true);
        setEmail('');
        setPassword('');
        setError('Account created! Please login.');
      }
    } catch (err) {
      triggerSelection();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    triggerSelection();
    setLoading(true);
    setError('');
    try {
      if (Capacitor.isNativePlatform()) {
        GoogleAuth.initialize();
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        if (!idToken) throw new Error("Google Sign-In failed to return an ID Token.");
        
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) throw error;
        
        triggerSelection();
        localStorage.setItem('token', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin + '/dashboard' }
        });
        if (error) throw error;
      }
    } catch (err) {
      triggerSelection();
      setError(err.message || 'Google Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <MessageSquare className="auth-logo-icon" size={48} />
          <h2 className="gradient-text">
            {isLogin ? 'Sign In to Automate' : 'Create Your Engine'}
          </h2>
          <p>
            {isLogin 
              ? 'Secure access to your personal messaging hub.' 
              : 'Join the next generation of WhatsApp automation.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                className={`auth-alert ${error.includes('created') ? 'success' : 'error'}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <Loader2 className="spinner" /> : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          className="google-auth-btn"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          Continue with Google
        </button>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button onClick={() => { triggerSelection(); setIsLogin(!isLogin); }} className="toggle-auth-btn noticeable-link">
              {isLogin ? 'Sign Up for FREE' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
