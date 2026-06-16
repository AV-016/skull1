import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata = {
  title: 'Privacy Policy - Skulture',
  description: 'Privacy policy and data handling guidelines for Skulture.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />
      
      {/* Content Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="heading-2 mb-4 font-extrabold tracking-tight">Privacy Policy</h1>
            <p className="subheading max-w-2xl mx-auto">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
            <div className="w-20 h-1 bg-primary mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="glass-card p-8 md:p-12 space-y-8 text-secondary-text leading-relaxed text-sm">
            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">1. Information We Collect</h2>
              <p className="mb-3">
                We collect personal information to provide and improve our services:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-4 mb-3">
                <li>**Account Data**: Your name, email address, password, phone number, and profile picture (if logged in via Google OAuth).</li>
                <li>**Order Data**: Shipping address, billing details, and items ordered.</li>
                <li>**File Submissions**: STL, OBJ, or other design files uploaded for custom quotes.</li>
                <li>**Analytics**: IP address, browser type, pages visited, and active sessions.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">2. How We Use Your Information</h2>
              <p className="mb-3">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-4">
                <li>To process, fulfill, and verify your orders and payments.</li>
                <li>To send transactional emails, verification codes, and order updates.</li>
                <li>To evaluate, slice, and quote custom 3D printing requests.</li>
                <li>To manage and improve our Platform user experience.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">3. Data Retention & Design Security</h2>
              <p>
                Your design files are processed securely. Uploaded STL/OBJ files are kept in secure Cloudinary storage buckets and database records only for the duration of the quoting and manufacturing process. You can request deletion of your files or account at any time through your member dashboard or by contacting support.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">4. Third-Party Services</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We share data only with trusted service providers necessary to operate the Platform: Resend (for email notifications), Razorpay (for payment processing), Supabase (for database hosting), and Cloudinary (for file storage). These partners are required to protect your data under strict confidentiality agreements.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">5. Cookies & Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to maintain session states (remember user login), store items in your cart, and analyze general Platform traffic. You can disable cookies in your browser settings, but doing so may limit your access to some features of the Platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">6. Security Measures</h2>
              <p>
                We implement robust security measures including data encryption (SSL/TLS) during transmission, secure JWT authentication tokens, and strict permission-based access control policies on databases to keep your personal information and design files safe.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">7. Policy Changes</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last updated" date at the bottom of this page.
              </p>
            </div>

            <div className="border-t border-border pt-6 text-xs text-muted-text flex justify-between">
              <span>Last updated: June 16, 2026</span>
              <span>Version 1.0</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
