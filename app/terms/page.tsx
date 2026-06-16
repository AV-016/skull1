import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata = {
  title: 'Terms & Conditions - Skulture',
  description: 'Terms and conditions for using the Skulture 3D printing and prototyping platform.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />
      
      {/* Content Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="heading-2 mb-4 font-extrabold tracking-tight">Terms & Conditions</h1>
            <p className="subheading max-w-2xl mx-auto">
              Please read these terms and conditions carefully before using the Skulture platform.
            </p>
            <div className="w-20 h-1 bg-primary mx-auto mt-6 rounded-full"></div>
          </div>

          <div className="glass-card p-8 md:p-12 space-y-8 text-secondary-text leading-relaxed text-sm">
            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">1. Agreement to Terms</h2>
              <p>
                By accessing or using Skulture (the "Platform", "we", "us", or "our"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not access or use the Platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">2. Intellectual Property & STL File Submissions</h2>
              <p className="mb-3">
                When you upload STL files, OBJ files, or other 3D designs to Skulture for custom printing quotes or orders:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-4">
                <li>You retain full ownership of all intellectual property rights in your designs.</li>
                <li>You grant us a temporary, non-exclusive, royalty-free license to use, store, and process the files solely for the purpose of analyzing, quoting, and manufacturing your 3D printed items.</li>
                <li>You represent and warrant that you own or have the necessary licenses and permissions for all designs uploaded, and that manufacturing the designs will not infringe upon any third-party intellectual property rights.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">3. Orders, Pricing, & Payments</h2>
              <p className="mb-3">
                All customized and catalog products are printed to order. Prices for catalog items are listed on the Platform. Custom prototyping or manufacturing quotes are valid for 14 days from issue.
              </p>
              <p>
                Payments are processed securely via our payment gateways (including Razorpay). For Cash on Delivery (COD) orders, cash payment must be made upon receipt of the items. We reserve the right to cancel any order if payment is not received or verified.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">4. Manufacturing Tolerances & Variations</h2>
              <p>
                3D printing is an additive manufacturing process. You acknowledge that finished products may exhibit minor cosmetic surface variations, layer lines, support structure markings, or dimensional deviations within standard manufacturing tolerances (+/- 0.2mm or 1% depending on the material and technology chosen). These variations are normal features of the manufacturing method and do not constitute product defects.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">5. Returns & Refunds</h2>
              <p>
                Due to the customized nature of 3D printed items made from uploaded files, custom orders are **non-refundable** and cannot be returned unless the items received are damaged in transit or differ significantly from the approved quotation specifications. Catalog items can be returned in accordance with our return guidelines within 7 days of delivery.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">6. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Skulture and its operators shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the Platform, or from products manufactured through the Platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary-text mb-3">7. Governing Law</h2>
              <p>
                These Terms & Conditions shall be governed by and construed in accordance with the laws of the jurisdiction in which the Platform operators reside, without regard to conflict of law principles.
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
