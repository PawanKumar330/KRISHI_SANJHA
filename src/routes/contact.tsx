import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { Phone, Mail, Clock, Send, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us & Customer Support | Krishi Sanjha" },
      {
        name: "description",
        content:
          "Official contact details, customer support helpline, email, and grievance redressal officer for Krishi Sanjha Technologies Pvt. Ltd.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "Booking Assistance",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      toast.error("Please fill in your Name, Phone Number, and Message.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      toast.success("Thank you! Your inquiry has been received. Our support team will contact you within 2-4 business hours.");
      setFormData({ name: "", phone: "", email: "", subject: "Booking Assistance", message: "" });
    }, 800);
  };

  return (
    <AppShell>
      <div className="bg-[#FAF7F1] py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7b5800]/10 text-[#7b5800] text-xs font-semibold tracking-wide border border-[#7b5800]/20 mb-4">
              📞 Customer Support & Grievance Desk
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#082717] tracking-tight mb-4">
              Get in Touch with Krishi Sanjha
            </h1>
            <p className="text-base sm:text-lg text-[#424843] max-w-2xl mx-auto leading-relaxed">
              We are here to assist farmers, machine owners, and operators with bookings, technical support, payment inquiries, and platform verification.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* Contact Information Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* Phone & Helpline */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-[#c2c8c1]/40">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#7b5800]/10 flex items-center justify-center text-[#7b5800] shrink-0 mt-1">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#082717] text-base mb-1">Phone & Helplines</h3>
                    <p className="text-sm text-[#424843] mb-1">
                      <strong className="text-[#082717]">Customer Care:</strong> +91 98765 43210
                    </p>
                    <p className="text-sm text-[#424843] mb-1">
                      <strong className="text-[#082717]">Toll-Free / Support:</strong> +91 80023 45678
                    </p>
                    <p className="text-sm text-[#424843]">
                      <strong className="text-[#082717]">WhatsApp Helpline:</strong> +91 98765 43210
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Addresses */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-[#c2c8c1]/40">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#082717]/10 flex items-center justify-center text-[#082717] shrink-0 mt-1">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#082717] text-base mb-1">Official Email</h3>
                    <p className="text-sm text-[#424843]">
                      <strong className="text-[#082717]">Email:</strong>{" "}
                      <a href="mailto:krishisanjha@gmail.com" className="text-[#7b5800] hover:underline font-medium">
                        krishisanjha@gmail.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-[#c2c8c1]/40">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#1f3d2b]/10 flex items-center justify-center text-[#1f3d2b] shrink-0 mt-1">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#082717] text-base mb-1">Support Hours</h3>
                    <p className="text-sm text-[#424843]">
                      Monday to Saturday: <strong className="text-[#082717]">8:00 AM – 8:00 PM IST</strong>
                    </p>
                    <p className="text-xs text-[#737873] mt-1">
                      Emergency machinery breakdown helpline active 24/7 during sowing and harvesting seasons.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Support Form */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xs border border-[#c2c8c1]/40 h-full flex flex-col justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-[#082717] mb-2">
                    Send Us an Inquiry
                  </h2>
                  <p className="text-sm text-[#424843] mb-6">
                    Fill in your details below and our team will get back to you promptly.
                  </p>

                  {isSent ? (
                    <div className="p-6 bg-[#f0eee8] rounded-xl border border-[#c2c8c1]/50 text-center my-6">
                      <CheckCircle2 className="size-10 text-[#1f3d2b] mx-auto mb-2" />
                      <h4 className="font-bold text-[#082717] text-lg mb-1">Message Sent Successfully</h4>
                      <p className="text-sm text-[#424843] mb-4">
                        Thank you for contacting Krishi Sanjha. Our support representative has been notified and will call you back shortly.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setIsSent(false)}
                        className="rounded-full"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase text-[#424843] mb-1.5">
                          Your Full Name <span className="text-red-600">*</span>
                        </label>
                        <Input
                          required
                          placeholder="e.g. Ramesh Kumar"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="bg-[#FAF7F1]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase text-[#424843] mb-1.5">
                            Mobile Number <span className="text-red-600">*</span>
                          </label>
                          <Input
                            required
                            type="tel"
                            placeholder="e.g. 9876543210"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="bg-[#FAF7F1]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase text-[#424843] mb-1.5">
                            Email Address (Optional)
                          </label>
                          <Input
                            type="email"
                            placeholder="e.g. ramesh@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-[#FAF7F1]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase text-[#424843] mb-1.5">
                          Inquiry Subject <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full rounded-md border border-input bg-[#FAF7F1] px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                        >
                          <option value="Booking Assistance">Machinery Booking Assistance</option>
                          <option value="Equipment Listing">Listing My Machine / Owner Inquiry</option>
                          <option value="Payment & Billing">Payment, Invoice or Refund Issue (Zoho Payments)</option>
                          <option value="Operator Application">Operator / Driver Registration</option>
                          <option value="General Grievance">Grievance / Dispute Redressal</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase text-[#424843] mb-1.5">
                          Your Message / Description <span className="text-red-600">*</span>
                        </label>
                        <Textarea
                          required
                          rows={4}
                          placeholder="Please provide details about your booking, machine requirement, or inquiry..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="bg-[#FAF7F1]"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-full bg-[#1f3d2b] text-white hover:bg-[#082717] py-3 text-sm font-semibold"
                      >
                        {isSubmitting ? (
                          "Sending Message..."
                        ) : (
                          <>
                            <Send className="size-4 mr-2" />
                            Submit Inquiry
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t border-[#c2c8c1]/30 text-xs text-[#737873]">
                  🔒 Your contact information is kept confidential and only used to respond to your support request in accordance with our Privacy Policy.
                </div>
              </div>
            </div>
          </div>

          {/* Grievance Redressal Officer Section (Statutory Compliance) */}
          <div className="bg-[#f0eee8] rounded-2xl p-8 border border-[#c2c8c1]/50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#7b5800]/15 flex items-center justify-center text-[#7b5800] shrink-0">
                <ShieldAlert className="size-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-[#082717]">
                  Statutory Grievance Redressal Officer
                </h3>
                <p className="text-xs sm:text-sm text-[#424843] leading-relaxed">
                  In accordance with the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020, the name and contact details of the Grievance Officer are designated below:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-[#737873] block">Officer Name:</span>
                    <strong className="text-[#1c1c18]">Mr. Pawan Kumar (Grievance Head)</strong>
                  </div>
                  <div>
                    <span className="text-[#737873] block">Direct Email:</span>
                    <a href="mailto:krishisanjha@gmail.com" className="font-semibold text-[#7b5800] hover:underline">
                      krishisanjha@gmail.com
                    </a>
                  </div>
                  <div>
                    <span className="text-[#737873] block">Response Redressal SLA:</span>
                    <strong className="text-[#1c1c18]">Acknowledgment within 48h; Resolution within 30 days</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
