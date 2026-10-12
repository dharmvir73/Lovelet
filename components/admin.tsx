'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/client';
type Row = {
  id: string;
  email: string;
  status: string;
  slug: string | null;
  order_id: string | null;
  payment_id: string | null;
  created: number;
  paid: number | null;
  removed: number;
  refund_id: string | null;
};
export function Admin() {
  const [logged, setLogged] = useState(false),
    [token, setToken] = useState(''),
    [rows, setRows] = useState<Row[]>([]),
    [events, setEvents] = useState<{ name: string; count: number }[]>([]),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function refresh() {
    const r = await api('/api/admin');
    setRows(r.purchases);
    setEvents(r.events);
    setLogged(true);
  }
  useEffect(() => {
    refresh().catch(() => {});
  }, []);
  async function action(name: string, id?: string) {
    if (
      ['refund', 'remove'].includes(name) &&
      !confirm(
        name === 'refund'
          ? 'Refund this captured payment and disable its page?'
          : 'Remove this page and its photos?',
      )
    )
      return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const r = await api('/api/admin', 'POST', { action: name, id });
      setMessage(
        name === 'cleanup'
          ? `Cleanup completed: ${r.removed} removed, ${r.recovered} recovered, ${r.failed} need retry.`
          : `${name} completed.`,
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      {!logged ? (
        <form
          className="admin-login"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api('/api/admin', 'POST', { action: 'login', token });
              setToken('');
              await refresh();
              setError('');
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="field">
            Administrator token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </label>
          <button className="button" disabled={busy}>
            Sign in →
          </button>
        </form>
      ) : (
        <>
          <div className="admin-stats">
            {['visits', 'builder_starts', 'previews', 'checkouts'].map(
              (name) => (
                <div key={name} className="admin-stat">
                  <strong>
                    {events.find((e) => e.name === name)?.count || 0}
                  </strong>
                  <span>{name.replace('_', ' ')}</span>
                </div>
              ),
            )}
          </div>
          <p className="fine">
            Anonymous funnel counters; latest 100 purchases below. Demo
            purchases do not represent revenue.
          </p>
          <div className="admin-tools">
            <button
              className="button small"
              onClick={() => action('cleanup')}
              disabled={busy}
            >
              Retry deliveries & clean expired content
            </button>
            <button
              className="button small secondary"
              onClick={() => refresh().catch((e) => setError(e.message))}
            >
              Refresh
            </button>
            <button
              className="button small secondary"
              onClick={async () => {
                await api('/api/admin', 'POST', { action: 'logout' });
                setLogged(false);
                setRows([]);
              }}
            >
              Sign out
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Purchase reference</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td title={p.id}>{p.id.slice(0, 12)}…</td>
                    <td>{p.email}</td>
                    <td>
                      <span className="status-pill">
                        {p.status}
                        {p.removed ? ' · removed' : ''}
                      </span>
                    </td>
                    <td>{new Date(Number(p.created)).toLocaleDateString()}</td>
                    <td>
                      {p.slug && !p.removed && (
                        <a
                          href={`/s/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open ↗{' '}
                        </a>
                      )}
                      <button
                        disabled={busy}
                        onClick={() => action('reconcile', p.id)}
                      >
                        Check payment
                      </button>
                      {!p.removed && (
                        <button
                          disabled={busy}
                          onClick={() => action('remove', p.id)}
                        >
                          Remove
                        </button>
                      )}
                      {p.payment_id && p.status === 'published' && (
                        <button
                          disabled={busy}
                          onClick={() => action('refund', p.id)}
                        >
                          Refund ₹199
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p style={{ padding: 20 }}>No purchases yet.</p>}
          </div>
        </>
      )}
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
    </div>
  );
}
