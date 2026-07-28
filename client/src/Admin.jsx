import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' && !navigator.userAgent.includes('Android') && !navigator.userAgent.includes('iPhone')
    ? 'http://localhost:3001'
    : 'https://lateron.indiecode.in');

const TIMEFRAMES = [
  { label: 'Last hour', value: 60 * 60 * 1000 },
  { label: 'Last 24 hours', value: 24 * 60 * 60 * 1000 },
  { label: 'Last 7 days', value: 7 * 24 * 60 * 60 * 1000 },
  { label: 'Last 30 days', value: 30 * 24 * 60 * 60 * 1000 },
  { label: 'All time', value: Infinity }
];

function timeAgo(ts) {
  if (!ts) return 'Never';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function Admin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [timeframe, setTimeframe] = useState(24 * 60 * 60 * 1000);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (authenticated) {
      pollingRef.current = setInterval(() => fetchUsers(password, true), 5000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [authenticated]);

  const fetchUsers = async (pw, silent) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'x-admin-password': pw }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Invalid password');
      }
      const data = await res.json();
      setUsers(data);
      return true;
    } catch (err) {
      if (!silent) setError(err.message);
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (await fetchUsers(password)) {
      setAuthenticated(true);
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({
      free_balance: u.free_balance,
      purchased_balance: u.purchased_balance,
      subscription_pack: u.subscription_pack || '',
      subscription_status: u.subscription_status || '',
      subscription_credits: u.subscription_credits || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const body = {};
      if (editForm.free_balance !== undefined) body.free_balance = parseInt(editForm.free_balance) || 0;
      if (editForm.purchased_balance !== undefined) body.purchased_balance = parseInt(editForm.purchased_balance) || 0;
      if (editForm.subscription_pack !== undefined) body.subscription_pack = editForm.subscription_pack || null;
      if (editForm.subscription_status !== undefined) body.subscription_status = editForm.subscription_status || null;
      if (editForm.subscription_credits !== undefined) body.subscription_credits = parseInt(editForm.subscription_credits) || null;

      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
      cancelEdit();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: "'Poppins', sans-serif" }}>
        <form onSubmit={handleLogin} style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', width: '320px' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 600, margin: '0 0 4px 0', color: '#1a1a1a' }}>Admin</h1>
          <p style={{ fontSize: '0.8rem', color: '#888', margin: '0 0 24px 0' }}>Enter admin password to continue</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{ width: '100%', padding: '10px 12px', fontSize: '0.85rem', border: '1px solid #ddd', borderRadius: '6px', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' }}
          />
          {error && <p style={{ fontSize: '0.8rem', color: '#dc2626', margin: '0 0 12px 0' }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            style={{ width: '100%', padding: '10px', fontSize: '0.85rem', fontWeight: 600, background: loading || !password ? '#ccc' : '#1a1a1a', color: 'white', border: 'none', borderRadius: '6px', cursor: loading || !password ? 'default' : 'pointer' }}
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  const now = Date.now();
  const activeUsers = users.filter(u => u.last_active && (now - u.last_active) < timeframe);
  const onlineUsers = users.filter(u => u.online);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: '#1a1a1a' }}>Admin Panel</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => fetchUsers(password)} style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, background: 'white', color: '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }}>
              Refresh
            </button>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, background: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              Dashboard
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Users</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.6rem', fontWeight: 600, color: '#1a1a1a' }}>{users.length}</p>
          </div>
          <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Online Now</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.6rem', fontWeight: 600, color: '#2e7d32' }}>{onlineUsers.length}</p>
          </div>
          <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.6rem', fontWeight: 600, color: '#1a73e8' }}>{activeUsers.length}</p>
          </div>
          <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select value={timeframe} onChange={e => setTimeframe(Number(e.target.value))} style={{ flex: 1, padding: '8px 10px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid #ddd', borderRadius: '6px', outline: 'none' }}>
              {TIMEFRAMES.map(tf => (
                <option key={tf.value} value={tf.value}>{tf.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontSize: '0.9rem' }}>
            Loading users...
          </div>
        )}

        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Active</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Free</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Purchased</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const isActiveInFrame = u.last_active && (now - u.last_active) < timeframe;
                  return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'white' : '#fafafa', opacity: isActiveInFrame ? 1 : 0.5 }}>
                    {editingId === u.id ? (
                      <>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1a1a1a' }}>
                          {u.online && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#2e7d32', marginRight: '6px' }} />}
                          {u.name}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#666' }}>{u.email}</td>
                        <td style={{ padding: '12px 16px', color: '#888', fontSize: '0.75rem' }}>{timeAgo(u.last_sign_in)}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input value={editForm.free_balance} onChange={e => setEditForm({...editForm, free_balance: e.target.value})} style={{ width: '60px', padding: '4px 6px', fontSize: '0.75rem', textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <input value={editForm.purchased_balance} onChange={e => setEditForm({...editForm, purchased_balance: e.target.value})} style={{ width: '60px', padding: '4px 6px', fontSize: '0.75rem', textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px' }} />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#1a1a1a' }}>
                          {(parseInt(editForm.free_balance) || 0) + (parseInt(editForm.purchased_balance) || 0)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <select value={editForm.subscription_pack} onChange={e => setEditForm({...editForm, subscription_pack: e.target.value})} style={{ padding: '4px 6px', fontSize: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                            <option value="">Mini Free</option>
                            <option value="Starter">Starter</option>
                            <option value="Popular">Popular</option>
                            <option value="Pro">Pro</option>
                            <option value="Business">Business</option>
                            <option value="Enterprise">Enterprise</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <select value={editForm.subscription_status} onChange={e => setEditForm({...editForm, subscription_status: e.target.value})} style={{ padding: '4px 6px', fontSize: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                            <option value="">free</option>
                            <option value="active">active</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: '#888', fontSize: '0.75rem' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button onClick={() => saveEdit(u.id)} style={{ padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600, background: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }}>Save</button>
                          <button onClick={cancelEdit} style={{ padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600, background: 'white', color: '#666', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1a1a1a' }}>
                          {u.online && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#2e7d32', marginRight: '6px' }} />}
                          {u.name}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#666' }}>{u.email}</td>
                        <td style={{ padding: '12px 16px', color: '#888', fontSize: '0.75rem' }}>{timeAgo(u.last_sign_in)}</td>
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
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button onClick={() => startEdit(u)} style={{ padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600, background: 'transparent', color: '#888', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}