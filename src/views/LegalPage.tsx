import { useStore } from "../lib/store";
import { IconClaw } from "../components/Icons";

const LEGAL_DOCS = {
  privacy: {
    title: "Privacy Policy",
    updated: "September 1, 2026",
    content: `
      <h3>1. Introduction</h3>
      <p>Tiger's Lair Academy ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our web dashboard, Telegram Mini App, and associated services.</p>
      
      <h3>2. Information We Collect</h3>
      <ul>
        <li><strong>Account Data:</strong> Name, email address, and password (securely hashed).</li>
        <li><strong>Telegram Data:</strong> Your Telegram User ID and username (if you choose to link your account for lesson delivery).</li>
        <li><strong>Payment Data:</strong> Transaction references and payment proof images. Note: We do not store your raw credit card details; all card transactions are processed securely via Paystack.</li>
        <li><strong>Progress Data:</strong> Course enrollment, lesson completion status, and quiz scores.</li>
      </ul>

      <h3>3. How We Use Your Information</h3>
      <p>We use your data strictly to provide our educational services, track your learning progress, issue certificates, process installment plans, and deliver daily lessons via our Telegram Bot.</p>

      <h3>4. Data Sharing</h3>
      <p>We do not sell your personal data. We only share data with trusted third-party service providers necessary to operate the platform (e.g., Paystack for payments, Cloudflare for hosting, and Telegram for messaging).</p>

      <h3>5. Your Rights</h3>
      <p>You may request access to, correction of, or deletion of your personal data at any time by contacting our support team.</p>
    `
  },
  terms: {
    title: "Terms of Service",
    updated: "September 1, 2026",
    content: `
      <h3>1. Acceptance of Terms</h3>
      <p>By accessing Tiger's Lair Academy, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>

      <h3>2. Intellectual Property</h3>
      <p>All course materials, videos, PDFs, code snippets, and platform designs are the exclusive property of Tiger's Lair Academy and its instructors. You are granted a limited, non-transferable license for personal educational use only.</p>
      
      <h3>3. Prohibited Conduct</h3>
      <ul>
        <li>Sharing your login credentials or account access with others.</li>
        <li>Downloading, screen-recording, or redistributing paid course videos.</li>
        <li>Using the platform for any unlawful purpose or to harass other students.</li>
      </ul>
      <p>Violation of these terms will result in immediate account termination without a refund.</p>

      <h3>4. User Content</h3>
      <p>By submitting assignments or participating in community meetups, you grant us permission to display your work within the private student community for educational feedback.</p>
    `
  },
  refund: {
    title: "Refund Policy",
    updated: "September 1, 2026",
    content: `
      <h3>1. Digital Product Nature</h3>
      <p>Due to the immediate digital access provided upon enrollment, Tiger's Lair Academy operates with a strict but fair refund policy.</p>

      <h3>2. Standard Refund Window</h3>
      <p>Refund requests are accepted within <strong>48 hours</strong> of initial enrollment, provided that <strong>less than 20%</strong> of the course material has been accessed or marked as complete.</p>

      <h3>3. Installment Plans</h3>
      <p>If you are on a bank-transfer installment plan, failure to upload valid payment proof by your due date will result in the temporary suspension of your access to course materials and the private Telegram channel. No refunds are issued for partial installment payments already approved.</p>

      <h3>4. How to Request a Refund</h3>
      <p>To request a refund within the eligible window, please email <strong>support@tigerslair.academy</strong> with your registered email address and the reason for the request. Approved refunds are processed back to the original payment method within 7-14 business days.</p>
    `
  },
  cookie: {
    title: "Cookie Policy",
    updated: "September 1, 2026",
    content: `
      <h3>1. What Are Cookies?</h3>
      <p>Cookies are small text files stored on your device to help the platform function correctly and remember your preferences.</p>

      <h3>2. Essential Cookies</h3>
      <p>We use essential cookies to keep you logged into your student dashboard and to track your course progress locally. The platform cannot function without these.</p>

      <h3>3. Analytics Cookies</h3>
      <p>We use privacy-focused analytics to understand which courses are most popular and where students get stuck, allowing us to improve the curriculum. No personally identifiable information is sold to advertisers.</p>

      <h3>4. Managing Cookies</h3>
      <p>You can clear cookies via your browser settings at any time, though this will log you out of your account.</p>
    `
  },
  ndpr: {
    title: "Data Protection (NDPR Compliance)",
    updated: "September 1, 2026",
    content: `
      <h3>1. NDPR Commitment</h3>
      <p>Tiger's Lair Academy complies with the Nigeria Data Protection Regulation (NDPR) and global privacy standards like the GDPR.</p>

      <h3>2. Data Security</h3>
      <p>All sensitive data is encrypted in transit using TLS 1.3 and at rest using industry-standard hashing algorithms. Our infrastructure is hosted on secure, enterprise-grade Cloudflare servers.</p>

      <h3>3. Data Protection Officer (DPO)</h3>
      <p>We have appointed a Data Protection Officer to oversee compliance. If you have concerns about how your data is handled, or wish to exercise your "Right to be Forgotten," please contact our DPO directly at <strong>privacy@tigerslair.academy</strong>.</p>

      <h3>4. Cross-Border Transfers</h3>
      <p>For international students, data may be processed on secure servers outside of Nigeria. We ensure that all third-party processors adhere to strict data protection agreements equivalent to NDPR standards.</p>
    `
  }
};

export default function LegalPage({ type }: { type: keyof typeof LEGAL_DOCS }) {
  const { go } = useStore();
  const doc = LEGAL_DOCS[type] || LEGAL_DOCS.privacy;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <button 
        onClick={() => go({ view: "home" })} 
        className="mb-8 flex items-center gap-2 text-sm text-smoke hover:text-amber transition-colors"
      >
        <span>←</span>
        <span>Back to Home</span>
      </button>

      <div className="rounded-2xl border border-bone/10 bg-coal p-8 sm:p-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber text-ink">
            <IconClaw className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-smoke">Legal Document</p>
            <h1 className="font-display text-2xl font-extrabold text-bone">{doc.title}</h1>
          </div>
        </div>
        
        <p className="text-xs text-smoke mb-8 border-b border-bone/10 pb-4">Last Updated: {doc.updated}</p>

        <div 
          className="prose prose-invert prose-sm max-w-none text-bone/90 leading-relaxed space-y-4
            [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-amber [&_h3]:mt-6 [&_h3]:mb-2
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:text-smoke
            [&_strong]:text-bone [&_strong]:font-bold"
          dangerouslySetInnerHTML={{ __html: doc.content }} 
        />

        <div className="mt-12 pt-6 border-t border-bone/10 text-center">
          <p className="text-xs text-smoke mb-4">Have questions about this policy?</p>
          <a 
            href="mailto:support@tigerslair.academy" 
            className="inline-block rounded-md bg-amber px-6 py-2 font-display text-xs font-extrabold uppercase tracking-widest text-ink hover:bg-amber/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}