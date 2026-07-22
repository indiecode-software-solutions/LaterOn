import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Calendar,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  Check,
  Users,
  BarChart3,
  Globe
} from 'lucide-react';
import heroImage from './assets/hero.jpeg';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }

    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) {
      setIsAndroid(true);
    }
  }, [navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="landing-container">
      {isAndroid && (
        <div className="android-banner">
          <span>Get the official LaterOn Android App!</span>
          <a href="/LaterOn.apk" download className="android-download-btn">
            Download APK
          </a>
        </div>
      )}
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <MessageSquare className="logo-icon" />
          <span>LaterOn</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <button onClick={() => navigate('/auth')} className="nav-btn">
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <motion.div
            className="hero-text"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h1 variants={itemVariants}>
              Automate Your WhatsApp, <br />
              <span className="gradient-text">Simplify Your Life</span>
            </motion.h1>
            <motion.p variants={itemVariants}>
              Never forget a birthday, schedule important reminders, and stay connected with the people who matter most. LaterOn is your personal WhatsApp assistant.
            </motion.p>
            <motion.div className="hero-btns" variants={itemVariants}>
              <button onClick={() => navigate('/auth')} className="btn-primary-large">
                Get Started for Free <ArrowRight size={20} />
              </button>
              <button className="btn-secondary-large">
                See How it Works
              </button>
            </motion.div>

            <motion.div className="social-proof" variants={itemVariants}>
              <div className="stats-item">
                <strong>10,000+</strong>
                <span>Happy Users</span>
              </div>
              <div className="divider"></div>
              <div className="stats-item">
                <strong>4.9/5</strong>
                <span>Rating</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="process-flow">
              {/* Step 1: Connect */}
              <motion.div
                className="flow-step step-1"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="step-icon"><Globe size={24} /></div>
                <div className="step-content">
                  <h4>Step 1: Connect</h4>
                  <p>Link your WhatsApp in seconds</p>
                  <div className="status-badge">Connected</div>
                </div>
              </motion.div>

              {/* Step 2: Schedule */}
              <motion.div
                className="flow-step step-2"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                <div className="step-icon"><MessageSquare size={24} /></div>
                <div className="step-content">
                  <h4>Step 2: Schedule</h4>
                  <div className="chat-bubble">"Happy B'day, Love❤️"</div>
                  <div className="time-tag"><Calendar size={14} /> Tomorrow, 12:00 AM</div>
                </div>
              </motion.div>

              {/* Step 3: Automate */}
              <motion.div
                className="flow-step step-3"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="step-icon"><Zap size={24} /></div>
                <div className="step-content">
                  <h4>Step 3: Relax</h4>
                  <p>LaterOn sends it perfectly</p>
                  <div className="success-badge">
                    <div className="double-tick">
                      <Check size={16} strokeWidth={3} />
                      <Check size={16} strokeWidth={3} />
                    </div>
                    Sent Successfully
                  </div>
                </div>
              </motion.div>

              {/* Decorative Lines */}
              <div className="flow-line line-1"></div>
              <div className="flow-line line-2"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Everything you need to <span className="highlight">Stay Connected</span></h2>
          <p>Simple tools designed to help you manage your time and messages without the stress.</p>
        </div>

        <div className="features-grid">
          {[
            { icon: <Calendar />, title: "Precision Scheduling", desc: "Plan your messages ahead of time. From birthday wishes to daily reminders, set it once and let us handle the rest.", size: "large" },
            { icon: <Zap />, title: "Instant Auto-Replies", desc: "Driving or in a meeting? Set up custom replies so your friends and family are never left on 'read'.", size: "tall" },
            { icon: <Shield />, title: "Private & Secure", desc: "Your privacy is our priority. We use end-to-end encryption to ensure your personal chats stay between you and your contacts.", size: "medium" },
            { icon: <BarChart3 />, title: "Message Tracking", desc: "See exactly when your messages are delivered and read with our simple, intuitive dashboard.", size: "medium" },
            { icon: <Users />, title: "Group Automation", desc: "Easily manage and automate messages for your friend groups, family chats, or community circles.", size: "large" },
            { icon: <Globe />, title: "Connect Anywhere", desc: "Message anyone, anywhere in the world. We support all international formats and time zones.", size: "medium" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className={`feature-card ${feature.size}`}
              whileHover={{ y: -10 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <motion.div
          className="cta-content"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2>Ready to simplify your life?</h2>
          <p>Join thousands of people who use LaterOn to stay organized and connected.</p>
          <button onClick={() => navigate('/auth')} className="btn-white">
            Get Started for Free
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="nav-logo">
              <MessageSquare className="logo-icon" />
              <span>LaterOn</span>
            </div>
            <p>Your personal assistant for a more connected and organized life.</p>
          </div>
          <div className="footer-links">
            <div className="link-group">
              <h4>Product</h4>
              <a href="#">Features</a>
              <a href="#">Pricing</a>
              <a href="#">API</a>
            </div>
            <div className="link-group">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div className="link-group">
              <h4>Legal</h4>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>Privacy Policy</a>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Terms &amp; Conditions</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 LaterOn Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
