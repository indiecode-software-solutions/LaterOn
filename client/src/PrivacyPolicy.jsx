import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      background: 'var(--bg-main, #f8fafc)',
      minHeight: '100vh',
      color: 'var(--text-main, #0f172a)',
      fontFamily: '"Outfit", sans-serif',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#1a73e8',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            padding: '8px 0',
            marginBottom: '32px'
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Shield size={32} color="#1a73e8" />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Privacy Policy</h1>
          </div>

          <p style={{ color: 'var(--text-muted, #475569)', fontSize: '0.95rem', marginBottom: '32px' }}>
            Last Updated: July 22, 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: '1.7', fontSize: '1rem', color: '#334155' }}>
            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '12px' }}>1. Information We Collect</h2>
              <p>We only collect information that is necessary to provide and improve LaterOn. This includes:</p>
              <ul>
                <li><strong>Account Information:</strong> Your name, email address, and authentication credentials when you register.</li>
                <li><strong>Integration Tokens:</strong> Authentication tokens (e.g. Google OAuth) which are securely stored using end-to-end encryption to enable features like Gmail sending and Calendar synchronization.</li>
                <li><strong>Scheduled Messages:</strong> The recipient's phone number or email and the content of the message you schedule.</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '12px' }}>2. How We Use Your Information</h2>
              <p>Your data is used strictly to execute your scheduled message requests, automate replies according to your custom rules, and handle connected calendars and mail dispatch. We never sell, rent, or trade your data to third parties for marketing purposes.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '12px' }}>3. Data Security</h2>
              <p>We implement industry-standard encryption protocols (SSL/TLS) for data transmission and secure cloud databases to store credentials. Access tokens and API keys are stored in an encrypted format to prevent unauthorized access.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '12px' }}>4. Your Controls</h2>
              <p>You can revoke API keys, disconnect your Google Account, delete scheduled messages, or request account deletion at any time directly through the Settings dashboard.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
