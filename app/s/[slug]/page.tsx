import { Recipient } from '@/components/recipient';
export const metadata = {
  title: 'A surprise for you',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <Recipient slug={(await params).slug} />;
}
