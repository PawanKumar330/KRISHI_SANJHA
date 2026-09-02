import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ShieldCheck, Tractor, Users, Award, MapPin, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | Krishi Sanjha - Agricultural Equipment Sharing" },
      {
        name: "description",
        content:
          "Learn about Krishi Sanjha Technologies Pvt. Ltd., our mission to democratize farm mechanization, and our verified agricultural machinery sharing platform in Bihar, India.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppShell>
      <div className="bg-[#FAF7F1] py-12 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Banner */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1f3d2b]/10 text-[#082717] text-xs font-semibold tracking-wide border border-[#1f3d2b]/20 mb-4">
              🌾 About Krishi Sanjha
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#082717] tracking-tight mb-4">
              Empowering Indian Farmers Through Shared Mechanization
            </h1>
            <p className="text-base sm:text-lg text-[#424843] max-w-2xl mx-auto leading-relaxed">
              Krishi Sanjha is a premier agricultural technology platform connecting farmers with verified farm machinery owners and skilled equipment operators across Bihar, India.
            </p>
          </div>

          {/* Business Overview Card */}
          <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xs border border-[#c2c8c1]/40 mb-10">
            <h2 className="font-serif text-2xl font-bold text-[#082717] mb-4 flex items-center gap-2">
              <Tractor className="size-6 text-[#7b5800]" />
              Our Business Description & Mission
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-[#424843] leading-relaxed">
              <p>
                <strong>Krishi Sanjha Technologies Private Limited</strong> operates an on-demand farm equipment rental and custom hiring marketplace. Small and marginal farmers often face severe financial barriers to purchasing modern, capital-intensive agricultural machinery such as tractors, rotavators, combine harvesters, laser levelers, and drip/irrigation pumping units.
              </p>
              <p>
                Meanwhile, equipment owners frequently experience long periods of machine under-utilization. Krishi Sanjha bridges this gap through a verified digital platform that enables:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <li className="flex items-start gap-2 bg-[#f6f3ed] p-3 rounded-lg">
                  <CheckCircle2 className="size-5 text-[#1f3d2b] shrink-0 mt-0.5" />
                  <span><strong>On-demand Machinery Booking:</strong> Instant discovery and reservation of verified tractors, harvesters, and implements at transparent, regulated rates.</span>
                </li>
                <li className="flex items-start gap-2 bg-[#f6f3ed] p-3 rounded-lg">
                  <CheckCircle2 className="size-5 text-[#1f3d2b] shrink-0 mt-0.5" />
                  <span><strong>Owner Revenue Maximization:</strong> Helping tractor and equipment owners monetize idle assets safely and reliably.</span>
                </li>
                <li className="flex items-start gap-2 bg-[#f6f3ed] p-3 rounded-lg">
                  <CheckCircle2 className="size-5 text-[#1f3d2b] shrink-0 mt-0.5" />
                  <span><strong>Certified Operator Deployment:</strong> Ensuring all deployed machinery is operated by licensed and safety-trained local drivers.</span>
                </li>
                <li className="flex items-start gap-2 bg-[#f6f3ed] p-3 rounded-lg">
                  <CheckCircle2 className="size-5 text-[#1f3d2b] shrink-0 mt-0.5" />
                  <span><strong>Transparent Escrow & Payments:</strong> Secure transaction handling in Indian Rupees (INR) through Zoho Payments, with clear cancellation and refund guarantees.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Company Details & Legal Profile for Verification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-[#c2c8c1]/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#1f3d2b]/10 flex items-center justify-center text-[#1f3d2b]">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#082717]">Corporate Profile</h3>
                  <p className="text-xs text-[#7b5800] font-medium">Official Business Identification</p>
                </div>
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-[#737873] uppercase font-semibold">Registered Entity Name</dt>
                  <dd className="font-medium text-[#1c1c18]">Krishi Sanjha Technologies Private Limited</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#737873] uppercase font-semibold">Brand / Doing Business As (DBA)</dt>
                  <dd className="font-medium text-[#1c1c18]">Krishi Sanjha (कृषि सांझा)</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#737873] uppercase font-semibold">Industry Sector</dt>
                  <dd className="font-medium text-[#1c1c18]">Agri-Tech / Farm Mechanization & Services Marketplace</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#737873] uppercase font-semibold">Operational Jurisdiction</dt>
                  <dd className="font-medium text-[#1c1c18]">State of Bihar & Republic of India</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#737873] uppercase font-semibold">Payment Gateway Partner</dt>
                  <dd className="font-medium text-[#1c1c18]">Zoho Payments (Authorized Merchant Account)</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-[#c2c8c1]/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#7b5800]/10 flex items-center justify-center text-[#7b5800]">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#082717]">Operating & Regional Office</h3>
                  <p className="text-xs text-[#7b5800] font-medium">Headquarters & Service Hub</p>
                </div>
              </div>
              <address className="not-italic text-sm text-[#424843] space-y-2 leading-relaxed">
                <p className="font-medium text-[#1c1c18]">
                  Krishi Sanjha Agri-Hub, Main Commercial Road,<br />
                  Opposite Block Agriculture Office,<br />
                  Jamui District, Bihar – 811307, India
                </p>
                <p className="pt-2">
                  <span className="font-semibold text-[#1c1c18]">Helpline:</span> +91 98765 43210 / +91 80023 45678
                </p>
                <p>
                  <span className="font-semibold text-[#1c1c18]">Official Email:</span> contact@krishisanjha.in / support@krishisanjha.in
                </p>
                <p>
                  <span className="font-semibold text-[#1c1c18]">Working Hours:</span> Mon–Sat 8:00 AM – 8:00 PM IST
                </p>
              </address>
            </div>
          </div>

          {/* Core Values */}
          <div className="bg-[#f0eee8] rounded-2xl p-8 md:p-10 mb-10 border border-[#c2c8c1]/40">
            <h2 className="font-serif text-2xl font-bold text-[#082717] mb-6 text-center">
              Our Core Commitments
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-[#c2c8c1]/30 text-center">
                <Award className="size-8 text-[#7b5800] mx-auto mb-3" />
                <h4 className="font-bold text-[#082717] mb-2">Fair & Upfront Pricing</h4>
                <p className="text-xs text-[#424843]">
                  Transparent hourly and per-acre pricing in INR without hidden intermediary markups.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-[#c2c8c1]/30 text-center">
                <ShieldCheck className="size-8 text-[#1f3d2b] mx-auto mb-3" />
                <h4 className="font-bold text-[#082717] mb-2">Strict Verification</h4>
                <p className="text-xs text-[#424843]">
                  Every equipment piece is physically verified and every driver is vetted with active commercial license checks.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-[#c2c8c1]/30 text-center">
                <Users className="size-8 text-[#082717] mx-auto mb-3" />
                <h4 className="font-bold text-[#082717] mb-2">Community First</h4>
                <p className="text-xs text-[#424843]">
                  Village Saathi network ensures technology is accessible even for farmers who do not own smartphones.
                </p>
              </div>
            </div>
          </div>

          {/* Quick CTA */}
          <div className="text-center pt-4">
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-3.5 rounded-full bg-[#1f3d2b] text-white font-medium text-sm hover:bg-[#082717] transition-all shadow-sm"
            >
              Get In Touch With Our Team
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
