import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { RotateCcw, RefreshCw, AlertTriangle, CheckCircle2, Clock, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Cancellation, Refund & Replacement Policy | Krishi Sanjha" },
      {
        name: "description",
        content:
          "Official Cancellation, Refund, Return, and Replacement Policy for agricultural machinery rentals and services on Krishi Sanjha (Zoho Payments).",
      },
    ],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <AppShell>
      <div className="bg-[#FAF7F1] py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-xs border border-[#c2c8c1]/40">
          <div className="border-b border-[#c2c8c1]/40 pb-6 mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7b5800] mb-2">
              <RotateCcw className="size-4" />
              <span>Customer Protection & Payment Terms · Effective Date: January 1, 2024</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#082717]">
              Cancellation, Refund & Replacement Policy
            </h1>
            <p className="text-sm text-[#424843] mt-2">
              At <strong>Krishi Sanjha Technologies Private Limited</strong>, we strive to deliver reliable, transparent, and fair agricultural machinery rental services. This policy outlines the terms for booking cancellations, replacement machinery, and payment refunds processed via <strong>Zoho Payments</strong>.
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base text-[#424843] leading-relaxed">
            {/* Section 1: Cancellation Policy */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                <Clock className="size-5 text-[#7b5800]" />
                1. Cancellation Policy
              </h2>
              <p className="mb-3">
                Farmers may cancel their scheduled machinery booking through the Krishi Sanjha dashboard or by calling customer support. The refund eligibility is determined according to the following schedule:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border border-[#c2c8c1]/60 rounded-xl overflow-hidden">
                  <thead className="bg-[#f0eee8] text-[#082717] font-semibold border-b border-[#c2c8c1]/60">
                    <tr>
                      <th className="p-3">Cancellation Scenario</th>
                      <th className="p-3">Time Window</th>
                      <th className="p-3">Refund Amount</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c2c8c1]/40">
                    <tr>
                      <td className="p-3 font-medium text-[#1c1c18]">Advance Farmer Cancellation</td>
                      <td className="p-3">&gt; 12 hours before slot</td>
                      <td className="p-3 font-bold text-green-700">100% Full Refund</td>
                      <td className="p-3 text-[#737873]">Zero cancellation fee applied.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-[#1c1c18]">Late Farmer Cancellation</td>
                      <td className="p-3">Within 2 to 12 hours</td>
                      <td className="p-3 font-bold text-[#7b5800]">90% Partial Refund</td>
                      <td className="p-3 text-[#737873]">10% retained for operator scheduling & fuel offset.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-[#1c1c18]">Immediate / En-route Cancellation</td>
                      <td className="p-3">&lt; 2 hours or machine arrived</td>
                      <td className="p-3 font-bold text-[#7b5800]">80% Partial Refund</td>
                      <td className="p-3 text-[#737873]">20% retained to compensate owner transit fuel.</td>
                    </tr>
                    <tr className="bg-[#f6f3ed]/50">
                      <td className="p-3 font-medium text-[#1c1c18]">Owner / Operator Cancellation</td>
                      <td className="p-3">Any time before work starts</td>
                      <td className="p-3 font-bold text-green-700">100% Full Refund OR Priority Replacement</td>
                      <td className="p-3 text-[#737873]">Instant replacement machine provided at no extra cost.</td>
                    </tr>
                    <tr className="bg-[#f6f3ed]/50">
                      <td className="p-3 font-medium text-[#1c1c18]">Adverse Weather / Rain / Flood</td>
                      <td className="p-3">Field unusable</td>
                      <td className="p-3 font-bold text-green-700">100% Full Refund OR Free Reschedule</td>
                      <td className="p-3 text-[#737873]">No penalty for climatic force majeure events.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 2: Machine Replacement Policy */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                <RefreshCw className="size-5 text-[#1f3d2b]" />
                2. Return & Machine Replacement Policy
              </h2>
              <div className="bg-[#f6f3ed] p-5 rounded-xl border border-[#c2c8c1]/40 space-y-3">
                <h4 className="font-bold text-[#082717]">Mechanical Failure Guarantee:</h4>
                <p>
                  In the rare event that a tractor, rotavator, pump, or harvester experiences a mechanical breakdown or operational defect while working on your land:
                </p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>
                    <strong>Immediate Dispatch:</strong> Krishi Sanjha operations will dispatch a verified replacement machine from the nearest village hub within <strong>2 to 4 hours</strong>.
                  </li>
                  <li>
                    <strong>No Extra Surcharge:</strong> The farmer will not be charged any transit fee for replacement machinery.
                  </li>
                  <li>
                    <strong>Pro-Rata Settlement:</strong> If a replacement is unavailable or declined by the farmer, we issue an immediate pro-rata refund for the unfulfilled hours or acreage.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3: Refund Policy & Process */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                <IndianRupee className="size-5 text-[#7b5800]" />
                3. Refund Terms & Processing Timeline (Zoho Payments)
              </h2>
              <p>
                All refunds are calculated transparently and initiated through our payment gateway, <strong>Zoho Payments</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div className="bg-[#f0eee8] p-4 rounded-xl border border-[#c2c8c1]/30">
                  <h4 className="font-bold text-[#082717] mb-1 flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="size-4 text-green-700" />
                    Refund Turnaround Time
                  </h4>
                  <p className="text-xs text-[#424843]">
                    Refunds are initiated within <strong>24 business hours</strong> of cancellation approval and credited to the customer's bank account / card / UPI ID within <strong>5 to 7 business days</strong>.
                  </p>
                </div>
                <div className="bg-[#f0eee8] p-4 rounded-xl border border-[#c2c8c1]/30">
                  <h4 className="font-bold text-[#082717] mb-1 flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="size-4 text-green-700" />
                    Mode of Refund
                  </h4>
                  <p className="text-xs text-[#424843]">
                    Refunds are always returned to the <strong>original source of payment</strong> (UPI / Net Banking / Debit Card / Credit Card) used during the initial transaction via Zoho Payments.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Return of Physical Implements & Attachments */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3">
                4. Handover & Return of Rented Implements
              </h2>
              <p>
                For daily dry-lease implements (e.g. disc harrows, cultivators, seed drills collected by farmers):
              </p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li><strong>Inspection on Delivery:</strong> The farmer and owner must inspect the implement prior to handover and note any pre-existing wear.</li>
                <li><strong>Safe Return:</strong> Implements must be returned to the owner's hub by the agreed rental end time in clean working condition.</li>
                <li><strong>Security Deposit Release:</strong> If a security deposit was held, it is unblocked and refunded within <strong>24 hours</strong> of return inspection.</li>
              </ul>
            </section>

            {/* Section 5: How to Claim a Refund */}
            <section className="bg-[#FAF7F1] p-6 rounded-xl border border-[#c2c8c1]/40">
              <h3 className="font-bold text-[#082717] mb-2 flex items-center gap-2">
                <AlertTriangle className="size-5 text-[#7b5800]" />
                How to Request a Cancellation or Refund
              </h3>
              <p className="text-sm text-[#424843] mb-3">
                To initiate a cancellation or inquire about your refund status, please provide your Booking ID and registered mobile number through any of these official channels:
              </p>
              <div className="text-sm space-y-1">
                <p><strong>Support Helpline:</strong> +91 98765 43210 (Mon–Sat 8 AM – 8 PM IST)</p>
                <p><strong>Refund Email:</strong> <a href="mailto:krishisanjha@gmail.com" className="text-[#7b5800] hover:underline">krishisanjha@gmail.com</a></p>
                <p><strong>Online Support Form:</strong> <Link to="/contact" className="text-[#7b5800] hover:underline font-semibold">Visit Contact & Support Desk</Link></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
