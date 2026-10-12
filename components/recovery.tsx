'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
export function Recovery() {
  const [email, setEmail] = useState(''),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="recovery-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          const r = await api('/api/recover', 'POST', { email });
          setMessage(r.message);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        The email you used
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>
      <button className="button" disabled={busy}>
        {busy ? 'Sending…' : 'Send my management link →'}
      </button>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <p className="fine">
        Your recovery link gives access to your purchase. Keep it private.
        Previous management links will be replaced.
      </p>
    </form>
  );
}
