import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { triggerSelection } from './haptics';

const API_URL = import.meta.env.VITE_API_URL || '';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popupStatus, setPopupStatus] = useState('');
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(window.location.search);
  const oauthStart = searchParams.get('oauth_start');
  const oauthCallback = searchParams.get('oauth_callback');
  const ticket = searchParams.get('ticket');
  const isPopupMode = oauthStart || oauthCallback;

  // Handler for OAuth Popup: Initiate OAuth from top-level window
  useEffect(() => {
    if (oauthStart === 'google') {
      setPopupStatus('Connecting to Google...');
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth?oauth_callback=1${ticket ? `&ticket=${ticket}` : ''}`
        }
      });
    }
  }, [oauthStart, ticket]);

  // Handler for OAuth Popup: Complete flow & relay session
  useEffect(() => {
    if (oauthCallback === '1') {
      setPopupStatus('Finalizing sign-in...');
      let isHandled = false;

      const finishPopup = async (session) => {
        if (!session || isHandled) return;
        isHandled = true;
        setPopupStatus('Success! Returning to app...');

        // 1. Relay to opener window via postMessage if accessible
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'LATERON_AUTH_SUCCESS', session, ticket }, '*');
          }
        } catch (e) {
          console.warn('[AUTH POPUP] Opener postMessage error:', e);
        }

        // 2. Deliver session to backend ticket exchange for guaranteed fallback
        if (ticket) {
          try {
            await axios.post(`${API_URL}/api/auth-exchange`, {
              ticket,
              session: {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                user: session.user
              }
            });
          } catch (e) {
            console.error('[AUTH POPUP] Auth exchange post error:', e);
          }
        }

        // 3. Close popup
        setTimeout(() => {
          try {
            window.close();
          } catch (e) {}
        }, 600);
      };

      // Check current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) finishPopup(session);
      });

      // Listen for session resolution from URL code
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) finishPopup(session);
      });

      return () => subscription.unsubscribe();
    }
  }, [oauthCallback, ticket]);

  // Regular auth state listener (only when not in OAuth popup mode)
  useEffect(() => {
    if (isPopupMode) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, isPopupMode]);

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
        const isInIframe = window.self !== window.top;
        if (isInIframe) {
          // Inside iframe: Google blocks rendering in frames (X-Frame-Options: DENY).
          // Open top-level popup which initiates OAuth with unpartitioned PKCE storage.
          const ticketId = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
          const popupUrl = `${window.location.origin}/auth?oauth_start=google&ticket=${ticketId}`;
          const popup = window.open(
            popupUrl,
            'lateron_google_oauth',
            'width=500,height=650,left=250,top=100'
          );

          let resolved = false;

          const onAuthSuccess = async (session) => {
            if (resolved) return;
            resolved = true;
            if (popup && !popup.closed) {
              try { popup.close(); } catch (e) {}
            }
            triggerSelection();
            try {
              await supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token
              });
            } catch (err) {
              console.warn('[AUTH] setSession warning:', err);
            }
            localStorage.setItem('token', session.access_token);
            localStorage.setItem('user', JSON.stringify(session.user));
            navigate('/dashboard');
          };

          // 1. Listen for postMessage from popup
          const messageListener = (e) => {
            if (e.data?.type === 'LATERON_AUTH_SUCCESS' && e.data?.session) {
              window.removeEventListener('message', messageListener);
              clearInterval(pollInterval);
              onAuthSuccess(e.data.session);
            }
          };
          window.addEventListener('message', messageListener);

          // 2. Poll /api/auth-exchange fallback
          const pollInterval = setInterval(async () => {
            if (resolved) {
              clearInterval(pollInterval);
              return;
            }
            try {
              const res = await axios.get(`${API_URL}/api/auth-exchange?ticket=${ticketId}`);
              if (res.data?.session) {
                clearInterval(pollInterval);
                window.removeEventListener('message', messageListener);
                onAuthSuccess(res.data.session);
              }
            } catch (err) {
              // Ignore network poll errors
            }
          }, 1000);

          // Timeout safety after 3 minutes
          setTimeout(() => {
            clearInterval(pollInterval);
            window.removeEventListener('message', messageListener);
            if (!resolved) {
              setLoading(false);
            }
          }, 180000);
        } else {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/dashboard' }
          });
          if (error) throw error;
        }
      }
    } catch (err) {
      triggerSelection();
      setError(err.message || 'Google Sign-in failed');
    } finally {
      if (window.self === window.top) {
        setLoading(false);
      }
    }
  };

  if (isPopupMode) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '36px 32px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          maxWidth: '380px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {popupStatus.includes('Success') ? (
            <CheckCircle size={44} style={{ color: '#10b981', marginBottom: '16px' }} />
          ) : (
            <Loader2 className="spinner" size={44} style={{ color: '#2563eb', marginBottom: '16px' }} />
          )}
          <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#0f172a', fontWeight: 600 }}>
            {popupStatus || 'Connecting...'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
            {popupStatus.includes('Success') 
              ? 'Closing window and returning to your workspace...' 
              : 'Please wait while we securely authenticate your account.'}
          </p>
        </div>
      </div>
    );
  }

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
