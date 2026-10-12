import { Header, Footer } from '@/components/chrome';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Policies & help' };
export default function Policies() {
  const contact = process.env.SUPPORT_EMAIL;
  const business = process.env.BUSINESS_NAME;
  return (
    <>
      <Header />
      <main className="wrap policy-page">
        <div className="eyebrow">THE DETAILS, WITH CARE</div>
        <h1>
          Small print.
          <br />
          <em>Clear promises.</em>
        </h1>
        {(!contact || !business) && (
          <div className="notice">
            Lovelet is in development. Live sales are not available until
            business and support information are configured.
          </div>
        )}
        <section id="contact">
          <h2>Contact & business information</h2>
          <p>Brand: Lovelet. {business && `Operated by ${business}.`}</p>
          {process.env.BUSINESS_ADDRESS && (
            <p>Business address: {process.env.BUSINESS_ADDRESS}</p>
          )}
          {contact ? (
            <p>
              Questions, failed delivery, photo removal requests or refunds:{' '}
              <a href={`mailto:${contact}`}>{contact}</a>. Include your purchase
              reference and the email used at checkout.
            </p>
          ) : (
            <p>
              Support contact details will be published before live payments are
              enabled.
            </p>
          )}
          <p>
            We aim to respond within 2 business days. This response target must
            be confirmed by the operator before launch.
          </p>
        </section>
        <section id="delivery">
          <h2>Pricing & digital delivery</h2>
          <p>
            One Lovelet costs ₹199 INR as displayed at checkout, with no
            subscription or physical delivery. It includes names, a message, up
            to 5 photos, 3 themes, a choice of 5 original synthesized melodies,
            and a private shareable link. A separate purchase creates a separate
            surprise.
          </p>
          <p>
            After payment is captured and verified, your link appears on screen
            and is emailed with a private management link. If payment is
            received but delivery is delayed, we retry automatically. Do not pay
            again: check your management link or contact support.
          </p>
          <p>
            You may edit your surprise for 24 hours after payment. Hosting lasts
            90 days from payment, then the page expires and its photos are
            deleted by the scheduled cleanup. You can permanently remove it
            earlier.
          </p>
        </section>
        <section id="privacy">
          <h2>Privacy & your photographs</h2>
          <p>
            We store your email, names, messages, theme choices, photos, hashed
            page password (if chosen), and payment identifiers to deliver and
            manage your purchase. Card details are handled by Razorpay; Lovelet
            does not collect card numbers.
          </p>
          <p>
            Pages are unlisted and excluded from search indexing, but anyone
            with a link can open or forward it. Choose a password for additional
            access protection. Your private management link allows edits and
            removal: never share it with the recipient.
          </p>
          <p>
            Only upload photos and music-free content you have permission to
            use. Do not upload sensitive identity, financial or medical
            information. Draft content is removed after 7 days without payment;
            expired paid content is removed by scheduled cleanup. Payment
            records may be retained as required for accounting and dispute
            handling.
          </p>
          <p>
            Operational services may include Razorpay, an email provider,
            database hosting and object storage. Authentication cookies protect
            password-locked pages and administration. Purchase management tokens
            are stored in your browser session for convenience. Anonymous
            aggregate counters record visits, builder starts, previews and
            checkouts; no advertising trackers are included.
          </p>
          <p>
            Request access, correction or removal through support. To request
            removal of a photo featuring you, share the page link and describe
            the image. We will review the request without asking you to disclose
            unnecessary personal information.
          </p>
        </section>
        <section id="terms">
          <h2>Terms of use</h2>
          <p>
            You must be at least 18 to buy a Lovelet. You are responsible for
            obtaining permission for content you upload and for using the
            service respectfully. Harassment, threats, impersonation, sexual
            content involving minors, illegal material and non-consensual
            private images are prohibited. We may remove content that violates
            these terms.
          </p>
          <p>
            Lovelet helps you express a feeling. It does not guarantee
            forgiveness, a reply, or any relationship outcome. The recipient is
            free to respond or not respond. Use sincere words and respect their
            boundaries.
          </p>
          <p>
            You retain ownership of your content and grant us only the
            permission needed to host and display your surprise for the hosting
            period. Use only images you are authorized to share. Do not forward
            your management link.
          </p>
        </section>
        <section id="refunds">
          <h2>Refunds & cancellations</h2>
          <p>
            Before payment, you may leave the builder without charge. For
            duplicate charges, failed digital delivery, or a material technical
            issue that we cannot resolve, contact support to request a refund.
            We verify requests against payment records and communicate the
            result by email.
          </p>
          <p>
            Personalized digital pages are delivered immediately after verified
            payment. Change-of-mind requests after delivery are reviewed
            individually. Nothing in this policy limits rights available under
            applicable law. Approved refunds return through Razorpay to the
            original payment method; banking timelines depend on the payment
            provider.
          </p>
          <p>
            If you paid but cannot find your link, use email recovery first.
            Please do not pay a second time. Removing your page does not
            automatically request or approve a refund.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
