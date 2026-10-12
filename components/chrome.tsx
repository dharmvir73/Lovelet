import Link from 'next/link';
import { Heart, ArrowUpRight } from 'lucide-react';
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Lovelet home">
      <span className="logo-mark">
        <Heart size={19} strokeWidth={1.8} />
      </span>
      lovelet<span className="logo-dot">.</span>
    </Link>
  );
}
export function Header({ simple = false }: { simple?: boolean }) {
  return (
    <header className="header">
      <div className="wrap nav">
        <Logo />
        {!simple ? (
          <>
            <nav className="nav-links">
              <Link href="/#how">How it works</Link>
              <Link href="/#themes">The themes</Link>
              <Link href="/#pricing">What’s inside</Link>
            </nav>
            <Link href="/create" className="button small">
              Make a Lovelet <ArrowUpRight size={16} />
            </Link>
          </>
        ) : (
          <Link href="/recover" className="text-link">
            Find my Lovelet <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div>
            <Logo />
            <p>Some feelings deserve more than a text.</p>
          </div>
          <div className="footer-links">
            <Link href="/recover">Find my Lovelet</Link>
            <Link href="/policies#contact">Contact & help</Link>
            <Link href="/policies#privacy">Privacy</Link>
            <Link href="/policies#terms">Terms</Link>
            <Link href="/policies#refunds">Refunds & delivery</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Lovelet. Made for the moments that
            matter.
          </span>
          <span>A little link, a lot of love ♡</span>
        </div>
      </div>
    </footer>
  );
}
