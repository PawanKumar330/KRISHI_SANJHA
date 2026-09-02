import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FileText, Shield, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Krishi Sanjha" },
      {
        name: "description",
        content:
          "Terms and Conditions governing the use of Krishi Sanjha agricultural machinery sharing platform, bookings, payments, and user responsibilities.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <AppShell>
      <div className="bg-[#FAF7F1] py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-xs border border-[#c2c8c1]/40">
          <div className="border-b border-[#c2c8c1]/40 pb-6 mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7b5800] mb-2">
              <FileText className="size-4" />
              <span>Legal Document · Effective Date: January 1, 2024</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#082717]">
              Terms of Service & User Agreement
            </h1>
            <p className="text-sm text-[#424843] mt-2">
              Please read these terms carefully before registering or using the Krishi Sanjha platform operated by <strong>Krishi Sanjha Technologies Private Limited</strong>.
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base text-[#424843] leading-relaxed">
            {/* Section 1 */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                1. Acceptance of Terms & Eligibility
              </h2>
              <p>
                By accessing, registering on, or using the Krishi Sanjha application, website, or offline Village Saathi assistance, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not access or use our services.
              </p>
              <div className="bg-[#f0eee8] p-4 rounded-xl mt-3 flex items-start gap-3 text-sm">
                <AlertCircle className="size-5 text-[#7b5800] shrink-0 mt-0.5" />
                <p>
                  <strong>Age & Legal Capacity:</strong> You must be at least <strong>18 years of age</strong> and legally capable of entering into binding contracts under the Indian Contract Act, 1872 to create an account, hire machinery, or list equipment on our platform.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3">
                2. Platform Role & Business Description
              </h2>
              <p>
                Krishi Sanjha Technologies Private Limited is a technology and marketplace facilitator that connects farmers seeking agricultural machinery with equipment owners and certified machine operators. We provide digital discovery, booking scheduling, identity verification, and secure online transaction processing via <strong>Zoho Payments</strong>.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3">
                3. User Accounts & Verification (KYC)
              </h2>
              <p>
                To maintain the security of our agricultural community, all users must complete a verification process:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li><strong>Farmers:</strong> Must provide accurate contact information, village/panchayat details, and plot mapping.</li>
                <li><strong>Equipment Owners:</strong> Must submit proof of machine ownership, registration documents, and machinery fitness declarations.</li>
                <li><strong>Operators / Drivers:</strong> Must hold a valid Indian commercial driving license (LMV-Transport / HMV) and undergo identity verification.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3">
                4. Pricing, Currency & Payment Terms
              </h2>
              <p>
                All pricing displayed on Krishi Sanjha is in <strong>Indian Rupees (₹ - INR)</strong>. Prices are determined on an hourly (e.g. ₹/hour) or per-area basis (e.g. ₹/Bigha or ₹/Acre) as agreed between the owner and renter.
              </p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li><strong>Payment Processing:</strong> Payments are processed through authorized payment gateway partners including <strong>Zoho Payments</strong>, supporting UPI, Net Banking, and Debit/Credit cards.</li>
                <li><strong>Advance Booking:</strong> An initial advance deposit may be charged upon booking confirmation to secure machine reservation and operator dispatch.</li>
                <li><strong>Balance Settlement:</strong> The remaining balance is payable upon satisfactory completion of the scheduled agricultural service.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3">
                5. Cancellations, Refunds & Replacements
              </h2>
              <p>
                Our detailed rules regarding cancellations, weather disruptions, equipment breakdowns, and refunds are governed by our dedicated{" "}
                <Link to="/refund-policy" className="text-[#7b5800] font-semibold underline">
                  Cancellation & Refund Policy
                </Link>
                :
              </p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li>Bookings cancelled more than 12 hours prior to start time receive a 100% refund.</li>
                <li>If a machine encounters mechanical failure during field operations, Krishi Sanjha arranges a replacement machine within 2–4 hours or issues a pro-rata refund.</li>
                <li>Approved refunds are credited to the original payment method via Zoho Payments within <strong>5–7 business days</strong>.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3">
                6. Machine Safety & Field Guidelines
              </h2>
              <p>
                Farmers and equipment owners agree to adhere to standard agricultural safety norms. Equipment must not be operated on hazardous terrain or during extreme weather conditions. Machine owners must ensure their equipment is roadworthy and adequately maintained.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3">
                7. Limitation of Liability
              </h2>
              <p>
                To the fullest extent permitted by Indian law, Krishi Sanjha Technologies Private Limited shall not be liable for indirect, incidental, or consequential damages resulting from crop yield variations, seasonal climate changes, or third-party mechanical faults beyond our direct control.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3">
                8. Governing Law & Dispute Resolution
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Jamui / Patna, Bihar, India</strong>.
              </p>
            </section>

            {/* Section 9 */}
            <section className="bg-[#FAF7F1] p-6 rounded-xl border border-[#c2c8c1]/40">
              <h3 className="font-bold text-[#082717] mb-2 flex items-center gap-2">
                <Shield className="size-5 text-[#1f3d2b]" />
                Contact for Legal Inquiries
              </h3>
              <p className="text-sm">
                For legal notices or inquiries regarding these Terms of Service, please reach out to:
              </p>
              <p className="text-sm font-semibold text-[#1c1c18] mt-2">
                Legal Department, Krishi Sanjha Technologies Pvt. Ltd.<br />
                Email: <a href="mailto:legal@krishisanjha.in" className="text-[#7b5800] hover:underline">legal@krishisanjha.in</a> / <a href="mailto:support@krishisanjha.in" className="text-[#7b5800] hover:underline">support@krishisanjha.in</a><br />
                Address: Krishi Sanjha Agri-Hub, Main Commercial Road, Jamui, Bihar - 811307, India
              </p>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
