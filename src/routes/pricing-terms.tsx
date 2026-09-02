import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { IndianRupee, CreditCard, ShieldCheck, CheckCircle2, Receipt, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/pricing-terms")({
  head: () => ({
    meta: [
      { title: "Pricing & Payment Terms | Krishi Sanjha" },
      {
        name: "description",
        content:
          "Transparent pricing models, advance payment terms, transaction currency in INR (₹), and payment gateway terms powered by Zoho Payments.",
      },
    ],
  }),
  component: PricingTermsPage,
});

function PricingTermsPage() {
  return (
    <AppShell>
      <div className="bg-[#FAF7F1] py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-xs border border-[#c2c8c1]/40">
          <div className="border-b border-[#c2c8c1]/40 pb-6 mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7b5800] mb-2">
              <IndianRupee className="size-4" />
              <span>Billing Transparency · Effective Date: January 1, 2024</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#082717]">
              Pricing & Payment Terms
            </h1>
            <p className="text-sm text-[#424843] mt-2">
              Learn how agricultural machinery prices are calculated, our advance payment terms, and secure payment processing in <strong>Indian Rupees (INR - ₹)</strong> via <strong>Zoho Payments</strong>.
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base text-[#424843] leading-relaxed">
            {/* Currency Declaration Card */}
            <div className="bg-[#f0eee8] p-6 rounded-2xl border border-[#c2c8c1]/50 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#7b5800]/15 flex items-center justify-center text-[#7b5800] shrink-0 mt-0.5">
                <IndianRupee className="size-6" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#082717] mb-1">
                  Official Transaction Currency: INR (₹)
                </h3>
                <p className="text-sm text-[#424843] leading-relaxed">
                  All machine rental tariffs, operator wages, transport fees, taxes, and service charges on Krishi Sanjha are quoted, billed, and processed exclusively in <strong>Indian Rupees (₹ - INR)</strong>. There are no cross-border currency conversion fees for domestic transactions.
                </p>
              </div>
            </div>

            {/* Section 1: Pricing Structure */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                1. Standard Machinery Rental Models
              </h2>
              <p className="mb-4">
                Equipment owners list machinery using standard pricing metrics customized for Bihar farming patterns:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-[#c2c8c1]/50 bg-[#FAF7F1]">
                  <h4 className="font-bold text-[#082717] text-base mb-1">Hourly Billing (₹ / Hour)</h4>
                  <p className="text-xs text-[#737873] mb-3">Best for short jobs, tillage, and pumping operations.</p>
                  <ul className="text-xs text-[#424843] space-y-1.5">
                    <li>• Tractors with Rotavator: ₹700 – ₹1,100 / hour</li>
                    <li>• Irrigation Pump Sets (Diesel): ₹180 – ₹300 / hour</li>
                    <li>• Laser Land Leveler: ₹1,000 – ₹1,400 / hour</li>
                  </ul>
                </div>

                <div className="p-5 rounded-xl border border-[#c2c8c1]/50 bg-[#FAF7F1]">
                  <h4 className="font-bold text-[#082717] text-base mb-1">Area-Based Billing (₹ / Acre or Katha)</h4>
                  <p className="text-xs text-[#737873] mb-3">Best for harvesting, threshing, and seeding.</p>
                  <ul className="text-xs text-[#424843] space-y-1.5">
                    <li>• Combine Harvester (Paddy/Wheat): ₹1,800 – ₹2,500 / acre</li>
                    <li>• Multi-Crop Thresher: ₹1,200 – ₹1,800 / acre</li>
                    <li>• Zero Tillage Seed Drill: ₹900 – ₹1,400 / acre</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2: Advance & Partial Payments */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                2. Advance Booking & Partial Payment Terms
              </h2>
              <p>
                To guarantee machine availability and dispatch of licensed operators, Krishi Sanjha operates a secure milestone payment structure:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong>Booking Advance (20%):</strong> Collected at the time of reserving the machine slot. This reserves the machinery calendar and compensates the owner for route planning.
                </li>
                <li>
                  <strong>Final Settlement (80%):</strong> Payable immediately upon completion of field work and mutual sign-off on the total hours or acres covered.
                </li>
                <li>
                  <strong>Full Upfront Payment Option:</strong> Farmers can also choose to prepay 100% via Zoho Payments for hassle-free automated completion.
                </li>
              </ul>
            </section>

            {/* Section 3: Payment Modes Supported (Zoho Payments) */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                <CreditCard className="size-5 text-[#7b5800]" />
                3. Accepted Payment Methods (via Zoho Payments)
              </h2>
              <p className="mb-3">
                We accept all major secure electronic payment methods in India through our licensed gateway partner <strong>Zoho Payments</strong>:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-[#f6f3ed] p-3 rounded-lg border border-[#c2c8c1]/30">
                  <span className="font-bold text-xs text-[#082717] block">UPI & QR</span>
                  <span className="text-[11px] text-[#737873]">GPay, PhonePe, Paytm, BHIM</span>
                </div>
                <div className="bg-[#f6f3ed] p-3 rounded-lg border border-[#c2c8c1]/30">
                  <span className="font-bold text-xs text-[#082717] block">Debit Cards</span>
                  <span className="text-[11px] text-[#737873]">RuPay, Visa, Mastercard</span>
                </div>
                <div className="bg-[#f6f3ed] p-3 rounded-lg border border-[#c2c8c1]/30">
                  <span className="font-bold text-xs text-[#082717] block">Credit Cards</span>
                  <span className="text-[11px] text-[#737873]">All Indian Banks</span>
                </div>
                <div className="bg-[#f6f3ed] p-3 rounded-lg border border-[#c2c8c1]/30">
                  <span className="font-bold text-xs text-[#082717] block">Net Banking</span>
                  <span className="text-[11px] text-[#737873]">50+ Indian Banks</span>
                </div>
              </div>
            </section>

            {/* Section 4: Invoices & Taxes */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                <Receipt className="size-5 text-[#1f3d2b]" />
                4. Tax Invoicing & GST Compliance
              </h2>
              <p>
                Every completed booking generates an itemized electronic GST invoice accessible in the farmer dashboard. The invoice clearly breaks down equipment hire rates, operator wages, fuel allowance, and applicable government taxes.
              </p>
            </section>

            {/* Section 5: Security & Support */}
            <section className="bg-[#f0eee8] p-6 rounded-xl border border-[#c2c8c1]/40 flex items-start gap-3">
              <ShieldCheck className="size-6 text-[#1f3d2b] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#082717] mb-1">Billing Support & Dispute Redressal</h4>
                <p className="text-xs sm:text-sm text-[#424843]">
                  Have a question about a charge, payment failure, or invoice? Email our billing team at{" "}
                  <a href="mailto:krishisanjha@gmail.com" className="text-[#7b5800] underline font-semibold">
                    krishisanjha@gmail.com
                  </a>{" "}
                  or call <strong>+91 98765 43210</strong>. Review our{" "}
                  <Link to="/refund-policy" className="text-[#7b5800] underline font-semibold">
                    Cancellation & Refund Policy
                  </Link>{" "}
                  for full refund timelines.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
