import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  Heart,
  Sparkles,
  Music,
  Image as ImageIcon,
  Link2,
  Check,
  MousePointer2,
  LockKeyhole,
} from 'lucide-react';
import { Header, Footer } from '@/components/chrome';
import { ThemeArt } from '@/components/theme-art';
import { Event } from '@/components/event';
import { themes } from '@/lib/content';
export default function Home() {
  return (
    <>
      <Header />
      <Event name="visits" />
      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-flower">✳</span> SMALL GESTURE. BIG
              FEELINGS.
            </div>
            <h1>
              For the words
              <br />
              you can’t quite
              <br />
              <em>put into words.</em>
              <span className="heading-star">✧</span>
            </h1>
            <p>
              Say “I’m sorry.” Say “you mean the world.”
              <br className="desktop-break" /> Turn what’s in your heart into a
              little digital surprise
              <br className="desktop-break" /> they’ll never expect.
            </p>
            <div className="hero-actions">
              <Link href="/create" className="button">
                Create your Lovelet <ArrowUpRight size={18} />
              </Link>
              <Link href="/demo" className="demo-link">
                <span className="play-icon">▶</span> Open a little demo
              </Link>
            </div>
            <div className="hero-note">
              <span className="price-badge">₹199</span>
              <span>One thoughtful gift. All your feelings included.</span>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-orbit" />
            <span className="floating-note note-one">
              made with a little love <Heart size={13} />
            </span>
            <div className="hero-window">
              <div className="window-bar">
                <span />
                <span />
                <span />
                <div>something just for you ♡</div>
                <LockKeyhole size={11} />
              </div>
              <ThemeArt theme="garden" />
              <div className="envelope-wrap">
                <div className="envelope">
                  <div className="envelope-flap" />
                  <div className="envelope-seal">
                    <Heart size={18} fill="currentColor" />
                  </div>
                  <span>To my favourite person</span>
                </div>
                <div className="envelope-note">
                  A little something, from the heart.
                </div>
                <Link href="/demo" className="open-note">
                  Open your surprise <ArrowRight size={13} />
                </Link>
              </div>
            </div>
            <div className="memory-chip">
              <span className="chip-photo">☀</span>
              <div>
                <strong>Your moments. Your words.</strong>
                <span>A story only you two share.</span>
              </div>
              <Heart size={16} />
            </div>
            <span className="floating-note note-two">
              a link worth opening <span>↗</span>
            </span>
            <span className="hero-spark spark-one">✧</span>
            <span className="hero-spark spark-two">✳</span>
          </div>
        </section>
        <div className="promise-bar">
          <div className="wrap promises">
            <span>
              <Heart size={16} /> Personal, down to the last word
            </span>
            <span>
              <Music size={16} /> A little music, a little magic
            </span>
            <span>
              <Link2 size={16} /> Made to share with one special person
            </span>
          </div>
        </div>
        <section id="how" className="section wrap">
          <div className="section-title">
            <div>
              <div className="eyebrow">FROM YOUR HEART TO THEIR SCREEN</div>
              <h2>
                A thoughtful gift.
                <br />
                <em>Without the overthinking.</em>
              </h2>
            </div>
            <p>
              No deliveries. No complicated steps.
              <br />
              Just a few minutes and a little piece of you.
            </p>
          </div>
          <div className="steps">
            <div>
              <span className="step-icon">
                <MousePointer2 />
              </span>
              <span className="step-number">01 / MAKE IT YOURS</span>
              <h3>Pick a little world</h3>
              <p>
                Choose a theme that feels like them. Dreamy, nostalgic, or a
                little out of this world.
              </p>
            </div>
            <div>
              <span className="step-icon">
                <ImageIcon />
              </span>
              <span className="step-number">02 / ADD YOUR FEELINGS</span>
              <h3>Tell your story</h3>
              <p>
                Your words, your photos, and a melody. Preview it until it feels
                just right.
              </p>
            </div>
            <div>
              <span className="step-icon">
                <Link2 />
              </span>
              <span className="step-number">03 / MAKE THEIR DAY</span>
              <h3>Send a little love</h3>
              <p>
                Pay ₹199, get your private link, and send it their way. The
                moment is theirs to open.
              </p>
            </div>
          </div>
        </section>
        <section id="themes" className="themes-section">
          <div className="wrap">
            <div className="section-title">
              <div>
                <div className="eyebrow">THREE WORLDS. ENDLESS FEELINGS.</div>
                <h2>
                  Find their kind of <em>magic.</em>
                </h2>
              </div>
              <Link href="/create" className="text-link">
                Explore the themes <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="theme-grid">
              {themes.map((t, i) => (
                <Link
                  className="theme-card"
                  href={`/create?theme=${t.id}`}
                  key={t.id}
                >
                  <div className="theme-preview">
                    <ThemeArt theme={t.id} />
                    <span className="theme-pill">{t.mood}</span>
                  </div>
                  <div className="theme-card-info">
                    <span className="theme-index">0{i + 1}</span>
                    <div>
                      <h3>{t.name}</h3>
                      <p>{t.tagline}</p>
                    </div>
                    <span className="circle-arrow">
                      <ArrowUpRight size={19} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <p className="theme-footnote">
              <Sparkles size={14} /> Every theme includes an envelope reveal,
              your photos, a personal message, and music.
            </p>
          </div>
        </section>
        <section className="section wrap occasion-section">
          <div className="eyebrow">YOU DON’T NEED A BIG OCCASION</div>
          <h2>
            Just a feeling <em>worth sharing.</em>
          </h2>
          <div className="occasion-chips">
            {[
              'I’m sorry',
              'You’re my person',
              'Happy birthday',
              'Thank you for being you',
              'Just because',
            ].map((v, i) => (
              <Link
                href={`/create?occasion=${i === 0 ? 'An%20apology' : i === 2 ? 'Birthday' : i === 3 ? 'Thank%20you' : 'Just%20because'}`}
                key={v}
              >
                <span>{['♡', '✧', '✷', '❋', '☀'][i]}</span>
                {v}
              </Link>
            ))}
          </div>
          <p>
            A sincere apology. A friendship that feels like home. A quiet “I
            love you.”
            <br />
            The little things are sometimes the biggest things.
          </p>
        </section>
        <section id="pricing" className="pricing-section wrap">
          <div className="pricing-copy">
            <div className="eyebrow">A SMALL PRICE FOR A PERSONAL MOMENT</div>
            <h2>
              All the heart.
              <br />
              <em>None of the fuss.</em>
            </h2>
            <p>
              One simple price, with everything you need to
              <br />
              make someone feel thought of.
            </p>
            <div className="scribble">small gesture, lasting feeling ↗</div>
          </div>
          <div className="price-card">
            <div className="price-card-top">
              <span>THE LITTLE LOVELET</span>
              <Heart size={22} />
            </div>
            <div className="price">
              ₹199<span>/ one surprise</span>
            </div>
            <p>Personalized by you. Opened with a smile.</p>
            <ul>
              {[
                'Your names & heartfelt message',
                'Up to 5 photos, all your favourite moments',
                '3 animated themes & 5 original melodies',
                'A private shareable link after payment',
                'Edit for 24 hours · hosted for 90 days',
              ].map((v) => (
                <li key={v}>
                  <Check size={16} />
                  {v}
                </li>
              ))}
            </ul>
            <Link href="/create" className="button">
              Make it personal <ArrowUpRight size={17} />
            </Link>
            <span className="price-fine">
              Try the builder free. Pay when it feels right.
            </span>
          </div>
        </section>
        <section className="section wrap faq">
          <div>
            <div className="eyebrow">A FEW LITTLE ANSWERS</div>
            <h2>
              Wondering <em>about something?</em>
            </h2>
            <Link href="/policies#contact" className="text-link">
              We’re here to help <ArrowUpRight size={15} />
            </Link>
          </div>
          <div>
            {[
              [
                'Do I need an account?',
                'No. Make and preview your surprise without signing up. Enter your email at checkout to receive your private management link.',
              ],
              [
                'How will they receive it?',
                'After verified payment, you get a unique link to send through WhatsApp, Instagram, email, or wherever you talk. They tap the envelope to open their surprise.',
              ],
              [
                'Can I change it after paying?',
                'Yes, for 24 hours after payment. Use your private management link. The surprise stays available for 90 days, and you can remove it sooner.',
              ],
              [
                'Is my Lovelet private?',
                'Pages are unlisted and excluded from search indexing. Anyone with the link can open or forward it, so add an optional password for extra privacy.',
              ],
              [
                'Will this fix a relationship?',
                'A Lovelet is a thoughtful way to express yourself. It cannot promise forgiveness or repair a relationship. Honest words matter most.',
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span>+</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="last-cta">
          <span>♡</span>
          <h2>
            Someone’s day could use
            <br />
            <em>a little you.</em>
          </h2>
          <Link href="/create" className="button">
            Send a little love <ArrowUpRight size={17} />
          </Link>
          <p>A little link. A lot of love.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
