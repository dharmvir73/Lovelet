'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, LoaderCircle } from 'lucide-react';
import { api } from '@/lib/client';
import { type SurpriseContent } from '@/lib/content';
import { Surprise } from './surprise';
export function Recipient({ slug }: { slug: string }) {
  const [content, setContent] = useState<SurpriseContent | null>(null),
    [locked, setLocked] = useState(false),
    [name, setName] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    api(`/api/s/${slug}`)
      .then((r) => {
        setContent(r.content || null);
        setLocked(!!r.locked);
        setName(r.recipient || '');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);
  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await api(`/api/s/${slug}`, 'POST', { password });
      setContent(r.content);
      setLocked(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  if (content)
    return (
      <Surprise
        content={content}
        photoUrls={content.photos.map((k) => `/api/photos/${k}?page=${slug}`)}
      />
    );
  return (
    <div className="locked-page">
      <span className="locked-heart">♡</span>
      {loading && !locked ? (
        <p>
          <LoaderCircle className="spin" /> Opening a little love…
        </p>
      ) : locked ? (
        <>
          <Lock size={24} />
          <h1>
            {name},<br />
            <em>a surprise is waiting.</em>
          </h1>
          <p>
            This little world has a password.
            <br />
            Ask the person who shared it with you.
          </p>
          <form onSubmit={unlock}>
            <label className="sr-only" htmlFor="password">
              Page password
            </label>
            <input
              id="password"
              type="password"
              placeholder="The secret password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={100}
              required
            />
            <button className="button" disabled={loading}>
              Open my surprise →
            </button>
          </form>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </>
      ) : (
        <>
          <h1>
            This little moment
            <br />
            <em>is unavailable.</em>
          </h1>
          <p>{error || 'The link may have expired or been removed.'}</p>
          <Link href="/" className="text-link">
            Visit Lovelet →
          </Link>
        </>
      )}
    </div>
  );
}
