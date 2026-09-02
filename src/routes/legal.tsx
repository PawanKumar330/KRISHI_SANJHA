import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Scale, ShieldAlert, Globe2, Award, FileCheck2, UserCheck } from "lucide-react";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal Disclosures & Regulatory Compliance | Krishi Sanjha" },
      {
        name: "description",
        content:
          "Legal restrictions, age requirements, operator licensing, industry-specific agricultural compliance, and export control disclosures for Krishi Sanjha.",
      },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <AppShell>
      <div className="bg-[#FAF7F1] py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 md:p-12 shadow-xs border border-[#c2c8c1]/40">
          <div className="border-b border-[#c2c8c1]/40 pb-6 mb-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7b5800] mb-2">
              <Scale className="size-4" />
              <span>Statutory Compliance · Effective Date: January 1, 2024</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#082717]">
              Legal Disclosures & Regulatory Restrictions
            </h1>
            <p className="text-sm text-[#424843] mt-2">
              Compliance statements, statutory restrictions, operator licensing rules, and territorial limitations for <strong>Krishi Sanjha Technologies Private Limited</strong>.
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base text-[#424843] leading-relaxed">
            {/* Section 1: Age & Legal Capacity */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                <UserCheck className="size-5 text-[#1f3d2b]" />
                1. Age Restrictions & Legal Capacity
              </h2>
              <div className="bg-[#f6f3ed] p-5 rounded-xl border border-[#c2c8c1]/40 space-y-2">
                <p>
                  <strong>Minimum Age Requirement (18+):</strong> Users must be at least <strong>18 years of age</strong> to register, rent equipment, list machinery, or enter into legally binding contracts on Krishi Sanjha.
                </p>
                <p className="text-xs text-[#737873]">
                  Minors (under 18 years) are strictly prohibited from creating accounts, hiring farm machinery, or operating motorized agricultural equipment on our platform.
                </p>
              </div>
            </section>

            {/* Section 2: Operator Licensing & Safety */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                <Award className="size-5 text-[#7b5800]" />
                2. Operator Licensing & Transport Regulations
              </h2>
              <p>
                In compliance with the <strong>Motor Vehicles Act, 1988</strong> and Central Motor Vehicles Rules (CMVR) of India:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>
                  <strong>Commercial Driving License:</strong> All operators driving tractors, combine harvesters, or specialized farm vehicles on public roadways or transit paths must possess a valid Indian Commercial Driving License (LMV-Transport / HMV category).
                </li>
                <li>
                  <strong>Background & Skill Verification:</strong> Krishi Sanjha verification officers physically inspect operator credentials and safety training certificates before activating driver profiles on the platform.
                </li>
                <li>
                  <strong>Vehicle Fitness & Insurance:</strong> Equipment owners must hold active third-party insurance and fitness certifications for all heavy motorized implements.
                </li>
              </ul>
            </section>

            {/* Section 3: Industry-Specific Agricultural Norms */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                <FileCheck2 className="size-5 text-[#1f3d2b]" />
                3. Agricultural Industry Standards & Safety Compliance
              </h2>
              <p>
                Krishi Sanjha aligns its operations with the guidelines established by the <strong>Ministry of Agriculture & Farmers Welfare, Government of India</strong> under the Sub-Mission on Agricultural Mechanization (SMAM):
              </p>
              <ul className="list-disc pl-6 space-y-1.5 mt-2">
                <li>All machinery attachments must meet Bureau of Indian Standards (BIS) specifications for agricultural equipment.</li>
                <li>Spraying and crop protection machinery must adhere to safe handling protocols outlined under the Insecticides Act, 1968.</li>
                <li>Emission norms for diesel tractors and pump sets adhere to Indian Bharat Stage (TREM) agricultural engine standards.</li>
              </ul>
            </section>

            {/* Section 4: Export Control & Territorial Restrictions */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                <Globe2 className="size-5 text-[#7b5800]" />
                4. Territorial Limitations & Export Restrictions
              </h2>
              <div className="bg-[#f0eee8] p-5 rounded-xl border border-[#c2c8c1]/50 space-y-2">
                <p>
                  <strong>Domestic Territorial Scope:</strong> All services, equipment hiring, operator deployments, and transactions offered on this website are exclusively intended for agricultural operations within the sovereign territory of the <strong>Republic of India</strong> (commencing in Jamui and expanding across Bihar).
                </p>
                <p>
                  <strong>Export Restrictions:</strong> The physical farm machinery, implements, and rental services facilitated through Krishi Sanjha are strictly non-exportable. Users may not transport or export rented equipment across international borders under any circumstances.
                </p>
              </div>
            </section>

            {/* Section 5: Payment Gateway Compliance */}
            <section>
              <h2 className="font-serif text-xl font-bold text-[#082717] mb-3 flex items-center gap-2">
                <Scale className="size-5 text-[#082717]" />
                5. Payment Gateway & Financial Compliance
              </h2>
              <p>
                Our payment infrastructure is operated in compliance with the Reserve Bank of India (RBI) Guidelines on Regulation of Payment Aggregators and Payment Gateways. Transactions are settled securely via <strong>Zoho Payments</strong> in Indian Rupees (INR).
              </p>
            </section>

            {/* Legal Notice Box */}
            <section className="bg-[#FAF7F1] p-6 rounded-xl border border-[#c2c8c1]/40 flex items-start gap-4">
              <ShieldAlert className="size-6 text-[#7b5800] shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-[#082717] mb-1">Corporate & Regulatory Inquiries</h4>
                <p className="text-xs sm:text-sm text-[#424843] mb-2">
                  For official inquiries regarding regulatory compliance, licensing verification, or legal notices, please write to:
                </p>
                <p className="text-xs sm:text-sm font-semibold text-[#1c1c18]">
                  Compliance Officer, Krishi Sanjha Technologies Pvt. Ltd.<br />
                  Email: <a href="mailto:compliance@krishisanjha.in" className="text-[#7b5800] hover:underline">compliance@krishisanjha.in</a> / <a href="mailto:support@krishisanjha.in" className="text-[#7b5800] hover:underline">support@krishisanjha.in</a><br />
                  Office: Krishi Sanjha Agri-Hub, Main Commercial Road, Jamui, Bihar - 811307, India
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <Link to="/terms" className="text-[#7b5800] underline font-semibold">Terms of Service</Link>
                  <Link to="/privacy" className="text-[#7b5800] underline font-semibold">Privacy Policy</Link>
                  <Link to="/refund-policy" className="text-[#7b5800] underline font-semibold">Refund Policy</Link>
                  <Link to="/contact" className="text-[#7b5800] underline font-semibold">Contact Us</Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
