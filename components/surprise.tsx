'use client';
import { useEffect, useRef, useState } from 'react';
import { Heart, Volume2, VolumeX, ArrowRight, ArrowLeft } from 'lucide-react';
import { tracks, type SurpriseContent } from '@/lib/content';
import { ThemeArt } from './theme-art';
export function Surprise({
  content,
  photoUrls,
  preview = false,
}: {
  content: SurpriseContent;
  photoUrls: string[];
  preview?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [scene, setScene] = useState(0),
    [playing, setPlaying] = useState(false);
  const audio = useRef<AudioContext | null>(null),
    timer = useRef<ReturnType<typeof setInterval> | null>(null),
    noteIndex = useRef(0);
  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    audio.current?.close().catch(() => {});
    audio.current = null;
    setPlaying(false);
  }
  async function play() {
    if (content.music === 'none') return;
    try {
      const ctx = new AudioContext();
      audio.current = ctx;
      await ctx.resume();
      const track = tracks.find((t) => t.id === content.music)!;
      const note = () => {
        if (ctx.state !== 'running') return;
        const osc = ctx.createOscillator(),
          gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value =
          track.notes[noteIndex.current++ % track.notes.length];
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2);
      };
      note();
      timer.current = setInterval(note, 900);
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      audio.current?.close().catch(() => {});
    },
    [],
  );
  const total = photoUrls.length + 2;
  return (
    <div
      className={`surprise-world world-${content.theme} ${preview ? 'preview-world' : ''}`}
    >
      <ThemeArt theme={content.theme} />
      <div className="world-particles" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `${i * 0.4}s`,
              top: `${(i * 19) % 90}%`,
            }}
          >
            ✧
          </i>
        ))}
      </div>
      <div className="surprise-brand">
        lovelet<span>♡</span>
      </div>
      {open && content.music !== 'none' && (
        <button
          className="sound-toggle"
          onClick={() => (playing ? stop() : play())}
          aria-label={playing ? 'Mute music' : 'Play music'}
        >
          {playing ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span>{playing ? 'Sound on' : 'Play music'}</span>
        </button>
      )}
      {!open ? (
        <div className="surprise-opening">
          <span className="surprise-eyebrow">
            SOMEONE HAS BEEN THINKING OF YOU
          </span>
          <h1>
            {content.recipient},<br />
            <em>this is for you.</em>
          </h1>
          <button
            className="recipient-envelope"
            onClick={() => {
              setOpen(true);
              play();
            }}
            aria-label="Open your surprise"
          >
            <div className="envelope-flap" />
            <span className="envelope-seal">
              <Heart fill="currentColor" size={25} />
            </span>
            <span className="envelope-address">
              with love, {content.sender}
            </span>
          </button>
          <button
            className="open-surprise"
            onClick={() => {
              setOpen(true);
              play();
            }}
          >
            Tap to open a little love <ArrowRight size={16} />
          </button>
          <p className="surprise-hint">
            Best enjoyed with sound on. Take your time.
          </p>
        </div>
      ) : (
        <div className="surprise-story" key={scene}>
          {scene === photoUrls.length ? (
            <>
              <span className="surprise-eyebrow">
                A NOTE FROM {content.sender.toUpperCase()}
              </span>
              <h1>
                Dear {content.recipient}
                <span className="story-heart">♡</span>
              </h1>
              <div className="story-letter">
                {content.message.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00a0'}</p>
                ))}
              </div>
              <span className="letter-signature">
                With love, {content.sender}
              </span>
            </>
          ) : scene < photoUrls.length ? (
            <>
              <span className="surprise-eyebrow">
                OUR LITTLE MOMENTS · {scene + 1} / {photoUrls.length}
              </span>
              <div className="story-photo">
                <img
                  src={photoUrls[scene]}
                  alt={`A memory from ${content.sender}, photo ${scene + 1}`}
                />
                <span>one of my favourite memories ♡</span>
              </div>
            </>
          ) : (
            <>
              <span className="final-heart">♡</span>
              <span className="surprise-eyebrow">ONE LAST LITTLE THING</span>
              <h1>
                <em>
                  {content.finalNote || 'You mean more than words can say.'}
                </em>
              </h1>
              <p className="final-signature">Always, {content.sender}</p>
              <span className="closing-note">
                No response needed. Just a little piece of my heart.
              </span>
            </>
          )}
          <div className="story-controls">
            <button
              onClick={() => setScene(Math.max(0, scene - 1))}
              disabled={scene === 0}
              aria-label="Previous scene"
            >
              <ArrowLeft size={17} />
            </button>
            <div className="story-dots">
              {Array.from({ length: total }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setScene(i)}
                  className={i === scene ? 'active' : ''}
                  aria-label={`Scene ${i + 1}`}
                />
              ))}
            </div>
            {scene < total - 1 ? (
              <button
                onClick={() => setScene(scene + 1)}
                aria-label="Next scene"
              >
                <ArrowRight size={17} />
              </button>
            ) : (
              <button
                onClick={() => {
                  setScene(0);
                  setOpen(false);
                  stop();
                }}
                aria-label="Replay surprise"
              >
                ↺
              </button>
            )}
          </div>
        </div>
      )}
      {preview && (
        <span className="preview-label">PREVIEW · ONLY YOU CAN SEE THIS</span>
      )}
    </div>
  );
}
