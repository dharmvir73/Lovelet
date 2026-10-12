import Link from 'next/link';
import { Header, Footer } from '@/components/chrome';
export default function NotFound() {
  return (
    <>
      <Header simple />
      <main className="not-found">
        <div className="eyebrow" style={{ justifyContent: 'center' }}>
          A LITTLE LOST?
        </div>
        <h1 style={{ marginTop: 20 }}>
          This page has
          <br />
          <em>wandered off.</em>
        </h1>
        <Link className="button" href="/">
          Back to Lovelet →
        </Link>
      </main>
      <Footer />
    </>
  );
}
