import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' && !navigator.userAgent.includes('Android') && !navigator.userAgent.includes('iPhone')
    ? 'http://localhost:3001'
    : 'https://lateron.indiecode.in');

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }
      const token = session.access_token;
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: '#1a1a1a' }}>Admin Panel</h1>
            <p style={{ fontSize: '0.85rem', color: '#666', margin: '4px 0 0 0' }}>{users.length} registered users</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchUsers} style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, background: 'white', color: '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>
              Refresh
            </button>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, background: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Back to Dashboard
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontSize: '0.9rem' }}>
            Loading users...
          </div>
        )}

        {error && (
          <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Free Credits</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Purchased</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1a1a1a' }}>{u.name}</td>
                      <td style={{ padding: '12px 16px', color: '#666' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#2e7d32' }}>{u.free_balance}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#1a73e8' }}>{u.purchased_balance}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#1a1a1a' }}>{u.total_balance}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, background: u.subscription_pack ? '#e8f0fe' : '#f0fdf4', color: u.subscription_pack ? '#1a73e8' : '#2e7d32' }}>
                          {u.subscription_pack || 'Mini Free'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, background: u.subscription_status === 'active' ? '#f0fdf4' : '#f5f5f5', color: u.subscription_status === 'active' ? '#2e7d32' : '#999' }}>
                          {u.subscription_status || 'free'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#888', fontSize: '0.75rem' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}