import { Suspense } from 'react';
import { Header, Footer } from '@/components/chrome';
import { Builder } from '@/components/builder';
import { isDemo } from '@/lib/security';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Manage your Lovelet',
  robots: { index: false, follow: false },
};
export default async function Manage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <>
      <Header simple />
      <main>
        <Suspense fallback={<p>Opening your Lovelet…</p>}>
          <Builder manageId={(await params).id} demoMode={isDemo()} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
