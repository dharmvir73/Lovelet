import { Suspense } from 'react';
import { Header, Footer } from '@/components/chrome';
import { Builder } from '@/components/builder';
import { isDemo } from '@/lib/security';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create your Lovelet' };
export default function Create() {
  return (
    <>
      <Header simple />
      <main>
        <Suspense
          fallback={
            <p className="loading-page">Preparing your little world…</p>
          }
        >
          <Builder demoMode={isDemo()} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
