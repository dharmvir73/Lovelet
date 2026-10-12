import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: {
    default: 'Lovelet — a little link, a lot of love',
    template: '%s · Lovelet',
  },
  description:
    'Turn the words in your heart into a beautiful digital surprise. Personalize names, photos, music and a message. One thoughtful gift, ₹199.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
