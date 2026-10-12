import { Header, Footer } from '@/components/chrome';
import { Admin } from '@/components/admin';
export const metadata = {
  title: 'Administration',
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <>
      <Header simple />
      <main className="wrap admin-page">
        <div className="eyebrow">BEHIND THE LITTLE MOMENTS</div>
        <h1>
          Lovelet <em>studio.</em>
        </h1>
        <Admin />
      </main>
      <Footer />
    </>
  );
}
