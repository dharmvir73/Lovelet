import Link from 'next/link';
import { Surprise } from '@/components/surprise';
import { demoContent } from '@/lib/content';
export const metadata = {
  title: 'A little demo',
  robots: { index: false, follow: false },
};
export default function Demo() {
  return (
    <>
      <div className="demo-toolbar">
        <Link href="/">← Lovelet</Link>
        <span>A fictional surprise, to give you a little idea.</span>
        <Link href="/create">Make yours · ₹199 ↗</Link>
      </div>
      <Surprise content={demoContent} photoUrls={[]} />
    </>
  );
}
