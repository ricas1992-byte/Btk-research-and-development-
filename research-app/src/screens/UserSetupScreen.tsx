import { useState, FormEvent, ChangeEvent } from 'react';

export function UserSetupScreen() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus('busy');
    setMsg('');

    let res: Response;
    try {
      res = await fetch('http://localhost:3000/api/admin/setup-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-bootstrap-token': token },
        body: JSON.stringify({ username, password, confirmPassword: confirm }),
        credentials: 'include',
      });
    } catch {
      setStatus('err');
      setMsg('Network error');
      return;
    }

    let data: { error?: string; message?: string };
    try {
      data = await res.json();
    } catch {
      setStatus('err');
      setMsg('Invalid response');
      return;
    }

    if (res.ok) {
      setStatus('ok');
      setMsg(data.message || 'Saved');
      setToken('');
      setUsername('');
      setPassword('');
      setConfirm('');
    } else {
      setStatus('err');
      setMsg(data.error || 'Failed');
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: 8, marginTop: 4, boxSizing: 'border-box' };

  return (
    <div style={{ maxWidth: 360, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 24 }}>User Setup</h1>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 12 }}>
          <label>Bootstrap Token</label>
          <input type="password" value={token} onChange={(e: ChangeEvent<HTMLInputElement>) => setToken(e.target.value)} style={inp} autoComplete="off" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Username</label>
          <input type="text" value={username} onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)} style={inp} autoComplete="username" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} style={inp} autoComplete="new-password" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Confirm Password</label>
          <input type="password" value={confirm} onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)} style={inp} autoComplete="new-password" />
        </div>
        <button type="submit" disabled={status === 'busy'} style={{ width: '100%', padding: 10, background: status === 'busy' ? '#888' : '#0070f3', color: '#fff', border: 0, cursor: 'pointer' }}>
          {status === 'busy' ? 'Saving...' : 'Save'}
        </button>
      </form>
      {msg && <div style={{ marginTop: 12, padding: 10, background: status === 'ok' ? '#d4edda' : '#f8d7da', color: status === 'ok' ? '#155724' : '#721c24' }}>{msg}</div>}
    </div>
  );
}
