'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  ImagePlus,
  X,
  Heart,
  Lock,
  Mail,
  Music,
  LoaderCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import {
  themes,
  tracks,
  type SurpriseContent,
  demoContent,
} from '@/lib/content';
import { api, compressPhoto } from '@/lib/client';
import { ThemeArt } from './theme-art';
import { Surprise } from './surprise';
import { Event } from './event';
type Auth = { id: string; editToken: string };
type RazorpayInstance = { open: () => void };
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}
const occasions = [
  'An apology',
  'Just because',
  'Birthday',
  'Anniversary',
  'Friendship',
  'Thank you',
];
const initial: SurpriseContent = {
  sender: '',
  recipient: '',
  occasion: 'An apology',
  message: '',
  finalNote: '',
  theme: 'garden',
  music: 'moonbeam',
  photos: [],
};
export function Builder({
  demoMode,
  manageId,
}: {
  demoMode: boolean;
  manageId?: string;
}) {
  const params = useSearchParams();
  const search = params.toString();
  const [content, setContent] = useState<SurpriseContent>(initial),
    [step, setStep] = useState(0),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [keepPassword, setKeepPassword] = useState(true),
    [protectedPage, setProtectedPage] = useState(false),
    [consent, setConsent] = useState(false),
    [files, setFiles] = useState<File[]>([]),
    [urls, setUrls] = useState<string[]>([]),
    [preview, setPreview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [auth, setAuth] = useState<Auth | null>(null),
    [result, setResult] = useState<{ slug: string; paid?: number } | null>(
      null,
    ),
    [pending, setPending] = useState(false),
    [loaded, setLoaded] = useState(!manageId),
    [canEdit, setCanEdit] = useState(true),
    [removed, setRemoved] = useState(false),
    [copied, setCopied] = useState(false),
    [saved, setSaved] = useState(false);
  const recoveryPoll = useRef<ReturnType<typeof setInterval> | null>(null);
  const dirty = useRef(false);
  const fileUrls = useRef<string[]>([]);
  useEffect(() => {
    if (!manageId) {
      const query = new URLSearchParams(search);
      const theme = query.get('theme');
      const occasion = query.get('occasion');
      setContent((v) => ({
        ...v,
        theme: themes.some((t) => t.id === theme)
          ? (theme as SurpriseContent['theme'])
          : 'garden',
        occasion: occasions.includes(occasion || '') ? occasion! : 'An apology',
      }));
      return;
    }
    const editToken =
      window.location.hash.slice(1) ||
      sessionStorage.getItem(`lovelet:${manageId}`) ||
      '';
    if (!editToken) {
      setError(
        'Open the complete management link from your email, or recover it below.',
      );
      setLoaded(true);
      return;
    }
    sessionStorage.setItem(`lovelet:${manageId}`, editToken);
    history.replaceState(null, '', window.location.pathname);
    const a = { id: manageId, editToken };
    let canceled = false;
    setAuth(a);
    api(`/api/purchases/${manageId}`, 'POST', {}, editToken)
      .then(() =>
        api(`/api/purchases/${manageId}`, 'GET', undefined, editToken),
      )
      .then((r) => {
        if (canceled) return;
        setContent(r.content);
        setEmail(r.email);
        setConsent(true);
        setProtectedPage(r.protected);
        setCanEdit(r.canEdit);
        setRemoved(r.removed);
        setUrls(
          r.content.photos.map(
            (key: string) => `/api/photos/${key}?owner=${manageId}`,
          ),
        );
        if (r.slug) setResult({ slug: r.slug, paid: r.paid });
        setLoaded(true);
      })
      .catch((e) => {
        if (canceled) return;
        setError(e.message);
        setLoaded(true);
      });
    return () => {
      canceled = true;
    };
  }, [manageId, search]);
  useEffect(() => {
    if (!preview) return;
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(false);
    };
    document.addEventListener('keydown', escape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', escape);
      document.body.style.overflow = '';
    };
  }, [preview]);
  useEffect(
    () => () => {
      if (recoveryPoll.current) clearInterval(recoveryPoll.current);
      fileUrls.current.forEach(URL.revokeObjectURL);
    },
    [],
  );
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  const change = (key: keyof SurpriseContent, value: unknown) => {
    setContent((c) => ({ ...c, [key]: value }));
    dirty.current = true;
    setSaved(false);
  };
  async function addPhotos(list: FileList | null) {
    if (!list) return;
    setError('');
    setBusy(true);
    try {
      if (files.length + content.photos.length + list.length > 5)
        throw new Error('You can add up to 5 photos.');
      const next: File[] = [];
      for (const file of Array.from(list)) next.push(await compressPhoto(file));
      const newUrls = next.map((f) => URL.createObjectURL(f));
      fileUrls.current.push(...newUrls);
      setFiles((v) => [...v, ...next]);
      setUrls((v) => [...v, ...newUrls]);
      dirty.current = true;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function removePhoto(index: number) {
    const storedCount = content.photos.length;
    if (index < storedCount) {
      change(
        'photos',
        content.photos.filter((_, i) => i !== index),
      );
    } else {
      setFiles((v) => v.filter((_, i) => i !== index - storedCount));
    }
    setUrls((v) => v.filter((_, i) => i !== index));
    dirty.current = true;
  }
  function validate(final = false) {
    if (!content.sender.trim() || !content.recipient.trim())
      throw new Error('Add both names so it feels personal.');
    if (content.message.trim().length < 10)
      throw new Error('Write a message of at least 10 characters.');
    if (final && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error(
        'Add a valid email for your delivery and management link.',
      );
    if (final && !consent)
      throw new Error('Please confirm the photo permissions and offer terms.');
  }
  async function save(): Promise<Auth> {
    validate(true);
    let a = auth;
    const body = {
      content: { ...content, photos: [] },
      email,
      password,
      consent: true,
    };
    if (!a) {
      a = await api('/api/drafts', 'POST', body);
      setAuth(a);
      sessionStorage.setItem(`lovelet:${a!.id}`, a!.editToken);
    }
    let keys = [...content.photos];
    await api(
      `/api/purchases/${a!.id}`,
      'PATCH',
      {
        ...body,
        content: { ...content, photos: keys },
        keepPassword: !!manageId && keepPassword,
      },
      a!.editToken,
    );
    for (const file of files) {
      const form = new FormData();
      form.append('photo', file);
      const r = await fetch(`/api/uploads?id=${a!.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${a!.editToken}` },
        body: form,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      keys.push(data.key);
      setContent((v) => ({ ...v, photos: [...keys] }));
      setFiles((v) => v.slice(1));
    }
    await api(
      `/api/purchases/${a!.id}`,
      'PATCH',
      {
        ...body,
        content: { ...content, photos: keys },
        keepPassword: !!manageId && keepPassword,
      },
      a!.editToken,
    );
    dirty.current = false;
    setSaved(true);
    return a!;
  }
  async function refresh(a: Auth) {
    const r = await api(
      `/api/purchases/${a.id}`,
      'GET',
      undefined,
      a.editToken,
    );
    if (r.slug && r.status === 'published') {
      setResult({ slug: r.slug, paid: r.paid });
      setPending(false);
      if (recoveryPoll.current) clearInterval(recoveryPoll.current);
    }
  }
  function poll(a: Auth) {
    setPending(true);
    if (recoveryPoll.current) clearInterval(recoveryPoll.current);
    recoveryPoll.current = setInterval(() => refresh(a).catch(() => {}), 5000);
  }
  async function checkout() {
    setError('');
    setBusy(true);
    try {
      const a = await save();
      const order = await api('/api/orders', 'POST', { id: a.id }, a.editToken);
      if (order.published) {
        setResult({ slug: order.slug });
        return;
      }
      if (order.demo) {
        const r = await api('/api/demo', 'POST', { id: a.id }, a.editToken);
        setResult({ slug: r.slug, paid: Date.now() });
        return;
      }
      if (!window.Razorpay)
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error('Could not load checkout. Please try again.'));
          document.body.appendChild(script);
        });
      new window.Razorpay({
        key: order.key,
        order_id: order.orderId,
        amount: 19900,
        currency: 'INR',
        name: 'Lovelet',
        description: 'One personalized digital surprise',
        prefill: { email },
        theme: { color: '#294f43' },
        handler: async (payment: Record<string, string>) => {
          setBusy(true);
          try {
            const r = await api(
              '/api/verify',
              'POST',
              { id: a.id, ...payment },
              a.editToken,
            );
            setResult({ slug: r.slug, paid: Date.now() });
          } catch {
            poll(a);
            setError(
              'Payment received—preparing your page. We will retry automatically. Please do not pay again.',
            );
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            refresh(a).catch(() => {});
          },
        },
      }).open();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveEdits() {
    setBusy(true);
    setError('');
    try {
      await save();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !auth ||
      !confirm(
        'Permanently remove this surprise and its photos? Your shared link will stop working.',
      )
    )
      return;
    setBusy(true);
    try {
      await api(
        `/api/purchases/${auth.id}`,
        'DELETE',
        undefined,
        auth.editToken,
      );
      setRemoved(true);
      dirty.current = false;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const completed = result && !manageId;
  if (!loaded)
    return (
      <div className="loading-page">
        <LoaderCircle className="spin" /> Opening your Lovelet…
      </div>
    );
  if (manageId && !auth)
    return (
      <div className="wrap utility-page">
        <h1>
          Find your <em>Lovelet.</em>
        </h1>
        <p role="alert">{error}</p>
        <Link className="button" href="/recover">
          Recover by email
        </Link>
      </div>
    );
  if (removed)
    return (
      <div className="wrap utility-page">
        <h1>Your page has been removed.</h1>
        <p>
          Your surprise and photos are no longer available through the shared
          link.
        </p>
        <Link href="/" className="button">
          Back to Lovelet
        </Link>
      </div>
    );
  if (completed)
    return (
      <section className="success-card">
        <span className="success-icon">
          <Check size={28} />
        </span>
        <div className="eyebrow">A LITTLE LOVE, READY TO SEND</div>
        <h1>
          Your Lovelet
          <br />
          is <em>ready.</em>
        </h1>
        {demoMode && (
          <div className="notice">Demo purchase · No money was charged.</div>
        )}
        <p>
          Send the link to {content.recipient}. Their little surprise is
          waiting.
        </p>
        <div className="share-box">
          <input
            readOnly
            aria-label="Shareable link"
            value={`${window.location.origin}/s/${result.slug}`}
          />
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${window.location.origin}/s/${result.slug}`,
                );
                setCopied(true);
              } catch {
                setError('Copy the link from the field above.');
              }
            }}
            aria-label="Copy link"
          >
            {copied ? <Check /> : <Copy />}
          </button>
        </div>
        <div className="success-actions">
          <Link className="button" href={`/s/${result.slug}`}>
            Open your Lovelet <ExternalLink size={16} />
          </Link>
          <a
            className="button secondary"
            href={`https://wa.me/?text=${encodeURIComponent(`A little something, just for you ♡ ${window.location.origin}/s/${result.slug}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            Share on WhatsApp
          </a>
        </div>
        {auth && (
          <div className="management-note">
            <strong>Keep your management link private</strong>
            <p>
              Save it now to edit for 24 hours or remove your page.{' '}
              {demoMode
                ? 'Email is not sent in local demo mode.'
                : 'We’ll also send it to your email.'}
            </p>
            <a
              className="text-link"
              href={`/manage/${auth.id}#${auth.editToken}`}
            >
              Manage this Lovelet <ArrowRight size={14} />
            </a>
          </div>
        )}
        <p className="fine">
          Hosted for 90 days from payment. Anyone with the share link can
          forward it.
          {password &&
            ' Your page is password protected; share the password separately.'}
        </p>
        {error && <p role="alert">{error}</p>}
      </section>
    );
  return (
    <>
      <Event name="builder_starts" />
      <div className="builder-heading wrap">
        <div className="eyebrow">
          {manageId ? 'YOUR LITTLE LOVELET' : 'A LITTLE PIECE OF YOUR HEART'}
        </div>
        <h1>
          {manageId ? 'Make it feel ' : 'Let’s make it '}
          <em>personal.</em>
        </h1>
        <p>
          {manageId
            ? 'Edit within 24 hours of payment. You can remove your page at any time.'
            : 'No account. No pressure. Just you, a few memories, and something lovely.'}
        </p>
        {demoMode && (
          <div className="notice">
            Local demo mode · Try the complete experience without a real
            payment.
          </div>
        )}
        {result && (
          <Link className="text-link" href={`/s/${result.slug}`}>
            View your shared surprise <ExternalLink size={14} />
          </Link>
        )}
      </div>
      <div className="builder-layout wrap">
        <div className="builder-main">
          <div className="builder-steps">
            {['The world', 'Your story', 'The details'].map((v, i) => (
              <button
                key={v}
                disabled={busy}
                onClick={() => setStep(i)}
                className={step === i ? 'active' : ''}
              >
                <span>{step > i ? <Check size={13} /> : i + 1}</span>
                {v}
              </button>
            ))}
          </div>
          <div className="builder-panel">
            {step === 0 ? (
              <>
                <div className="eyebrow">01 / SET THE FEELING</div>
                <h2>
                  A world just <em>for them.</em>
                </h2>
                <p>Pick the setting for your little story.</p>
                <div className="builder-themes">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      className={`builder-theme ${content.theme === t.id ? 'selected' : ''}`}
                      onClick={() => change('theme', t.id)}
                      disabled={!canEdit || busy}
                    >
                      <ThemeArt theme={t.id} mini />
                      <div>
                        <strong>{t.name}</strong>
                        <span>{t.mood}</span>
                      </div>
                      <span className="select-circle">
                        {content.theme === t.id && <Check size={13} />}
                      </span>
                    </button>
                  ))}
                </div>
                <label className="field">
                  What’s the occasion?
                  <select
                    value={content.occasion}
                    onChange={(e) => change('occasion', e.target.value)}
                    disabled={!canEdit || busy}
                  >
                    {occasions.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : step === 1 ? (
              <>
                <div className="eyebrow">02 / TELL YOUR STORY</div>
                <h2>
                  It’s the little things
                  <br />
                  <em>that mean everything.</em>
                </h2>
                <div className="field-row">
                  <label className="field">
                    Your name
                    <input
                      maxLength={60}
                      placeholder="e.g. Alex"
                      value={content.sender}
                      onChange={(e) => change('sender', e.target.value)}
                      disabled={!canEdit || busy}
                    />
                  </label>
                  <label className="field">
                    Their name
                    <input
                      maxLength={60}
                      placeholder="e.g. Jamie"
                      value={content.recipient}
                      onChange={(e) => change('recipient', e.target.value)}
                      disabled={!canEdit || busy}
                    />
                  </label>
                </div>
                <label className="field">
                  Your heartfelt message
                  <textarea
                    aria-label="Your heartfelt message"
                    rows={7}
                    maxLength={3000}
                    placeholder="The things I’ve been meaning to say…"
                    value={content.message}
                    onChange={(e) => change('message', e.target.value)}
                    disabled={!canEdit || busy}
                  />
                  <span className="field-help">
                    Your words are enough. Keep it honest.{' '}
                    <span>{content.message.length}/3000</span>
                  </span>
                </label>
                <button
                  className="text-link writing-help"
                  disabled={!canEdit || busy}
                  onClick={() => {
                    if (
                      content.message &&
                      !confirm(
                        'Replace your current message with a starting point?',
                      )
                    )
                      return;
                    change(
                      'message',
                      content.occasion === 'An apology'
                        ? `I’ve been thinking about what happened, and I want to say I’m sorry. I take responsibility for the hurt I caused.\n\nYou don’t owe me forgiveness or a reply. I’m listening, and I want my actions to reflect the care and respect you deserve.`
                        : `You make the everyday moments feel special. Thank you for being part of my life.\n\nI made this little surprise to remind you how much you mean to me.`,
                    );
                  }}
                >
                  ✧ A little help getting started
                </button>
                <label className="field">
                  One final note <span className="optional">(optional)</span>
                  <input
                    aria-label="One final note"
                    maxLength={300}
                    placeholder="Here’s to the memories still to come. ♡"
                    value={content.finalNote}
                    onChange={(e) => change('finalNote', e.target.value)}
                    disabled={!canEdit || busy}
                  />
                </label>
                <div className="field">
                  <span>
                    Your little moments{' '}
                    <span className="optional">(up to 5 photos)</span>
                  </span>
                  <div className="photo-grid">
                    {urls.map((url, i) => (
                      <div className="upload-thumb" key={url}>
                        <img src={url} alt={`Photo ${i + 1}`} />
                        {canEdit && (
                          <button
                            aria-label={`Remove photo ${i + 1}`}
                            onClick={() => removePhoto(i)}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    {urls.length < 5 && canEdit && (
                      <label className="upload-button">
                        <ImagePlus size={22} />
                        <span>Add photos</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          onChange={(e) => {
                            addPhotos(e.target.files);
                            e.target.value = '';
                          }}
                          disabled={busy}
                          aria-label="Add photos"
                        />
                      </label>
                    )}
                  </div>
                  <span className="field-help">
                    JPG, PNG or WebP, up to 10 MB each. Compressed before
                    upload.
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="eyebrow">03 / THE FINISHING TOUCHES</div>
                <h2>
                  A little music.
                  <br />
                  <em>A lot of feeling.</em>
                </h2>
                <label className="field">
                  Choose a melody
                  <Music size={16} className="field-icon" />
                  <select
                    value={content.music}
                    disabled={!canEdit || busy}
                    onChange={(e) => change('music', e.target.value)}
                  >
                    {tracks.map((t) => (
                      <option value={t.id} key={t.id}>
                        {t.name} · {t.description}
                      </option>
                    ))}
                    <option value="none">No music · Just the words</option>
                  </select>
                </label>
                <p className="fine">
                  Five original synthesized melodies, made for Lovelet. Music
                  begins when they open the envelope.
                </p>
                <label className="field">
                  Your email
                  <Mail size={16} className="field-icon" />
                  <input
                    aria-label="Your email"
                    type="email"
                    maxLength={254}
                    placeholder="you@example.com"
                    value={email}
                    disabled={!!manageId || busy}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <span className="field-help">
                    For your delivery and private management link. No account
                    needed.
                  </span>
                </label>
                <label className="field">
                  Page password <span className="optional">(optional)</span>
                  <Lock size={16} className="field-icon" />
                  <input
                    aria-label="Page password"
                    type="password"
                    maxLength={100}
                    placeholder={
                      protectedPage && keepPassword
                        ? 'Existing password kept'
                        : 'Add a password for extra privacy'
                    }
                    value={password}
                    disabled={!canEdit || busy}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setKeepPassword(false);
                    }}
                  />
                  {protectedPage && canEdit && (
                    <button
                      className="text-link"
                      onClick={() => {
                        setKeepPassword(false);
                        setPassword('');
                        setProtectedPage(false);
                      }}
                    >
                      Remove existing password
                    </button>
                  )}
                  <span className="field-help">
                    An unlisted link can still be forwarded. Share the password
                    separately.
                  </span>
                </label>
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    disabled={!canEdit || busy}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    I have permission to use these photos and content. I agree
                    to the{' '}
                    <Link href="/policies#terms" target="_blank">
                      terms
                    </Link>{' '}
                    and{' '}
                    <Link href="/policies#privacy" target="_blank">
                      privacy policy
                    </Link>
                    . My page is editable for 24 hours and hosted for 90 days
                    after payment.
                  </span>
                </label>
                <div className="checkout-summary">
                  <span>One personalized Lovelet</span>
                  <strong>₹199</strong>
                </div>
                <p className="fine">
                  One-time payment in INR. No subscription. Your link is
                  published only after captured payment is verified.
                </p>
              </>
            )}
            {error && (
              <div className="form-error" role="alert">
                {error}
                {pending && (
                  <>
                    <br />
                    <Link href="/policies#contact">Contact support</Link>
                  </>
                )}
              </div>
            )}
            {saved && manageId && (
              <div className="notice" role="status">
                Your changes are saved.
              </div>
            )}
            {!canEdit && (
              <div className="notice">
                The editing window is closed. You can still open or remove your
                page.
              </div>
            )}
            <div className="builder-actions">
              {step > 0 ? (
                <button
                  className="button secondary"
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft size={15} /> Back
                </button>
              ) : (
                <Link href="/" className="text-link">
                  ← Back home
                </Link>
              )}
              {step < 2 ? (
                <button
                  className="button"
                  onClick={() => {
                    setError('');
                    setStep(step + 1);
                  }}
                >
                  Continue <ArrowRight size={16} />
                </button>
              ) : canEdit ? (
                <button
                  className="button"
                  disabled={busy || pending}
                  onClick={manageId && result ? saveEdits : checkout}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <Heart size={17} />
                  )}{' '}
                  {manageId && result
                    ? 'Save changes'
                    : pending
                      ? 'Preparing your page…'
                      : demoMode
                        ? 'Create demo Lovelet'
                        : 'Pay ₹199 & send love'}
                </button>
              ) : null}
            </div>
            {auth && !manageId && !result && (
              <div className="fine">
                Draft saved.{' '}
                <a href={`/manage/${auth.id}#${auth.editToken}`}>
                  Keep your private management link
                </a>{' '}
                to check payment status or return later.
              </div>
            )}
            {manageId && (
              <button className="delete-link" onClick={remove} disabled={busy}>
                Permanently remove this Lovelet
              </button>
            )}
          </div>
        </div>
        <aside className="builder-aside">
          <div className="preview-top">
            <span>
              <span className="live-dot" /> YOUR LITTLE WORLD
            </span>
            <span>Live preview</span>
          </div>
          <div className="builder-preview">
            <ThemeArt theme={content.theme} />
            <div className="preview-envelope">
              <span>To {content.recipient || 'your favourite person'}</span>
              <div className="mini-envelope">♡</div>
              <p>A little something, from {content.sender || 'you'}.</p>
              <button
                onClick={() => {
                  setPreview(true);
                  api('/api/events', 'POST', { name: 'previews' }).catch(
                    () => {},
                  );
                }}
              >
                <Eye size={15} /> Open full preview
              </button>
            </div>
          </div>
          <div className="aside-note">
            <Heart size={16} />
            <p>
              It doesn’t have to be perfect.
              <br />
              It just has to come from you.
            </p>
          </div>
          <div className="aside-includes">
            <span>EVERY LOVELET INCLUDES</span>
            <p>
              <Check size={14} /> An animated envelope reveal
            </p>
            <p>
              <Check size={14} /> Your personal message & photos
            </p>
            <p>
              <Check size={14} /> 90 days to revisit the moment
            </p>
          </div>
        </aside>
      </div>
      {preview && (
        <div
          className="preview-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Your surprise preview"
        >
          <button className="close-preview" onClick={() => setPreview(false)}>
            <X size={18} /> Close preview
          </button>
          <Surprise
            content={{
              ...content,
              sender: content.sender || demoContent.sender,
              recipient: content.recipient || demoContent.recipient,
              message: content.message || demoContent.message,
            }}
            photoUrls={urls}
            preview
          />
        </div>
      )}
    </>
  );
}
