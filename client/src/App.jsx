import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import LandingPage from './LandingPage';
import Dashboard from './Dashboard';
import Auth from './Auth';
import PrivacyPolicy from './PrivacyPolicy';
import Terms from './Terms';

import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const ProtectedRoute = ({ children, loading, session }) => {
  // If the URL has an access token hash, wait for Supabase to parse it
  const hasAuthToken = window.location.hash && window.location.hash.includes('access_token=');
  
  // If the URL has an error param, redirect back to login
  const hasError = window.location.href.includes('error=');

  if (hasError) return <Navigate to="/auth" replace />;

  if (loading || hasAuthToken) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div className="loader"></div>
    </div>
  );
  if (!session) return <Navigate to="/auth" replace />;
  return children;
};

function CookieConsent() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('cookie-consent') === 'true');

  if (dismissed || Capacitor.isNativePlatform()) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10000,
      background: '#1a1a2e', color: '#e0e0e0', padding: '12px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '16px', fontSize: '0.82rem', flexWrap: 'wrap',
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <span>We use cookies to enhance your experience. By using LaterOn, you agree to our use of cookies.</span>
      <button
        onClick={() => { localStorage.setItem('cookie-consent', 'true'); setDismissed(true); }}
        style={{
          padding: '8px 20px', background: '#25d366', color: 'white', border: 'none',
          fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap'
        }}
      >
        Got it
      </button>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user', JSON.stringify(session.user));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user', JSON.stringify(session.user));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            session ? (
              <Navigate to="/dashboard" replace />
            ) : Capacitor.isNativePlatform() ? (
              <Navigate to="/auth" replace />
            ) : (
              <LandingPage />
            )
          } 
        />
        <Route 
          path="/auth" 
          element={session ? <Navigate to="/dashboard" replace /> : <Auth />} 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute loading={loading} session={session}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/privacy" 
          element={<PrivacyPolicy />} 
        />
        <Route 
          path="/terms" 
          element={<Terms />} 
        />
      </Routes>
      <CookieConsent />
    </Router>
  );
}

export default App;
