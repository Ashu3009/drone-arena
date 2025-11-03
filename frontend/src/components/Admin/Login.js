import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please enter username and password');
      setLoading(false);
      return;
    }

    const result = await login(username, password);

    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.message || 'Login failed');
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.header}>
          <h1 style={styles.title}>Drone Arena</h1>
          <p style={styles.subtitle}>Admin Login</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Enter username"
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            style={loading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={styles.footer}>
          <a href="/" style={styles.link}>View Public Dashboard</a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  loginBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    color: '#fff',
    fontSize: '32px',
    marginBottom: '8px',
    fontWeight: 'bold'
  },
  subtitle: {
    color: '#888',
    fontSize: '16px',
    margin: 0
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  error: {
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '12px',
    borderRadius: '6px',
    textAlign: 'center',
    fontSize: '14px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    color: '#ccc',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '6px',
    padding: '12px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '10px'
  },
  buttonDisabled: {
    backgroundColor: '#666',
    cursor: 'not-allowed'
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center'
  },
  link: {
    color: '#4CAF50',
    textDecoration: 'none',
    fontSize: '14px'
  }
};

export default Login;
