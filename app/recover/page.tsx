import { Header, Footer } from '@/components/chrome';
import { Recovery } from '@/components/recovery';
export const metadata = {
  title: 'Find your Lovelet',
  robots: { index: false, follow: false },
};
export default function Recover() {
  return (
    <>
      <Header simple />
      <main className="wrap utility-page">
        <div className="eyebrow">LET’S FIND YOUR LITTLE WORLD</div>
        <h1>
          Your Lovelet.
          <br />
          <em>Right where you left it.</em>
        </h1>
        <p>Enter your email and we’ll send you a secure management link.</p>
        <Recovery />
      </main>
      <Footer />
    </>
  );
}
