import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Scale } from 'lucide-react';

const Terms = () => {
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
            <Scale size={32} color="#1a73e8" />
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Terms & Conditions</h1>
          </div>

          <p style={{ color: 'var(--text-muted, #475569)', fontSize: '0.95rem', marginBottom: '32px' }}>
            Last Updated: July 22, 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', lineHeight: '1.7', fontSize: '1rem', color: '#334155' }}>
            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '12px' }}>1. Acceptance of Terms</h2>
              <p>By creating an account, connecting your WhatsApp session, or scheduling notifications on LaterOn, you agree to comply with and be bound by these Terms and Conditions. If you disagree with any part of these terms, please stop using the service immediately.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '12px' }}>2. Acceptable Use Policy</h2>
              <p>You agree not to use LaterOn to schedule or send any messages that are unsolicited (spam), harassing, abusive, illegal, or that violate the WhatsApp Business Policy or Terms of Service. Doing so will result in instant account suspension.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '12px' }}>3. Service Limitations & Disclaimers</h2>
              <p>LaterOn is provided "as is" and "as available". Since our automation connects with WhatsApp Web, scheduled message delivery may depend on session connectivity, WhatsApp server status, and browser status. We do not guarantee 100% uninterrupted delivery.</p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', marginBottom: '12px' }}>4. Limitation of Liability</h2>
              <p>In no event shall LaterOn, its developers, or its parent company be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use or inability to use the service.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
