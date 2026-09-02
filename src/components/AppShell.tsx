import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Languages, Menu, X, ShieldCheck, Phone, Mail, MapPin, IndianRupee } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import { OFFLINE_MODE } from "@/lib/api";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF7F1] text-[#1c1c18] font-sans antialiased">
      {/* Sticky Navigation (TopAppBar) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF7F1]/90 dark:bg-[#1c1c18]/90 backdrop-blur-md border-b border-[#c2c8c1]/30 shadow-xs">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#082717] dark:text-[#c8ebd1] text-3xl">
              agriculture
            </span>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#082717] dark:text-[#c8ebd1]">
              Krishi Sanjha
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-[#424843] hover:text-[#082717] transition-colors"
            >
              {t("marketplace")}
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium text-[#424843] hover:text-[#082717] transition-colors"
            >
              {t("aboutUs")}
            </Link>
            <a
              href="/#how-it-works"
              className="text-sm font-medium text-[#424843] hover:text-[#082717] transition-colors"
            >
              {t("howItWorksNav")}
            </a>
            <a
              href="/#categories"
              className="text-sm font-medium text-[#424843] hover:text-[#082717] transition-colors"
            >
              {t("categoriesNav")}
            </a>
            <Link
              to="/pricing-terms"
              className="text-sm font-medium text-[#424843] hover:text-[#082717] transition-colors"
            >
              {t("pricingPaymentTerms")}
            </Link>
            <Link
              to="/contact"
              className="text-sm font-medium text-[#424843] hover:text-[#082717] transition-colors"
            >
              {t("contactUs")}
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="rounded-full border-[#c2c8c1] hover:bg-[#e5e2dc]/50"
              aria-label="Switch language"
            >
              <Languages className="size-4 mr-1" />
              {lang === "en" ? "हिन्दी" : "English"}
            </Button>

            {user ? (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" asChild className="rounded-full">
                  <Link to="/dashboard">{t("dashboard")}</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    signOut();
                    navigate({ to: "/login", replace: true });
                  }}
                  className="rounded-full"
                >
                  <LogOut className="size-4 mr-1" />
                  <span>{t("logout")}</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="rounded-full">
                  <Link to="/login">{t("login")}</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="rounded-full bg-gradient-to-r from-[#1f3d2b] to-[#466551] text-white hover:shadow-md transition-shadow"
                >
                  <Link to="/register">{t("getStarted")}</Link>
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="px-2"
            >
              <Languages className="size-4" />
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#424843] hover:text-[#082717]"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-[#c2c8c1]/30 bg-[#FAF7F1] px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#7b5800]"
              >
                {t("marketplace")}
              </Link>
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#424843]"
              >
                {t("aboutUs")}
              </Link>
              <a
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#424843]"
              >
                {t("howItWorksNav")}
              </a>
              <a
                href="/#categories"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#424843]"
              >
                {t("categoriesNav")}
              </a>
              <Link
                to="/pricing-terms"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#424843]"
              >
                {t("pricingPaymentTerms")}
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#424843]"
              >
                {t("contactUs")}
              </Link>
              <div className="pt-2 border-t border-[#c2c8c1]/30 flex flex-col gap-2">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        {t("dashboard")}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                        navigate({ to: "/login", replace: true });
                      }}
                      className="w-full justify-start"
                    >
                      <LogOut className="size-4 mr-2" />
                      <span>{t("logout")}</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        {t("login")}
                      </Link>
                    </Button>
                    <Button size="sm" asChild className="w-full bg-[#1f3d2b] text-white">
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                        {t("getStarted")}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Area with Header Offset */}
      <main className="flex-1 pt-20">{children}</main>

      {/* Trust & Payment Security Banner */}
      <div className="bg-[#1f3d2b] text-[#FAF7F1] py-4 px-4 text-center border-t border-[#2c4e38]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm font-medium">
          <span className="flex items-center gap-1.5 text-[#ffdea5]">
            <ShieldCheck className="size-4 shrink-0" />
            <span>{t("securePayments")}</span>
          </span>
          <span className="hidden sm:inline text-white/30">|</span>
          <span className="flex items-center gap-1 text-white/90">
            <IndianRupee className="size-4 shrink-0 text-[#ffcd6d]" />
            <span>{t("currencyDeclaration")}</span>
          </span>
          <span className="hidden sm:inline text-white/30">|</span>
          <Link to="/refund-policy" className="text-[#ffdea5] hover:underline font-semibold">
            {t("cancellationRefundPolicy")} &rarr;
          </Link>
        </div>
      </div>

      {/* Comprehensive Zoho-Compliant Footer */}
      <footer className="border-t border-[#c2c8c1]/40 bg-[#e5e2dc]/80">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Column 1: Company Profile & Registration */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#082717] text-3xl">
                  agriculture
                </span>
                <span className="font-serif text-xl font-bold text-[#082717]">Krishi Sanjha</span>
              </div>
              <p className="text-xs font-bold text-[#082717] mb-1">
                {t("registeredEntity")}
              </p>
              <p className="text-xs text-[#424843] leading-relaxed mb-3">
                Empowering Indian farmers through shared access to verified machinery and certified operators.
              </p>
              <div className="text-xs text-[#424843] space-y-1">
                <div className="flex items-start gap-1.5">
                  <MapPin className="size-3.5 text-[#7b5800] shrink-0 mt-0.5" />
                  <span>Main Road, Opposite Block Agri Office, Jamui, Bihar – 811307</span>
                </div>
              </div>
              {OFFLINE_MODE ? (
                <p className="mt-2 text-[11px] text-[#7b5800]">{t("offlineNote")}</p>
              ) : null}
            </div>

            {/* Column 2: Quick Links & Services */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-[#082717] mb-1">{t("quickLinks")}</p>
              <Link to="/" className="text-xs sm:text-sm text-[#424843] hover:text-[#7b5800] transition-colors">
                {t("marketplace")}
              </Link>
              <Link to="/about" className="text-xs sm:text-sm text-[#424843] hover:text-[#7b5800] transition-colors">
                {t("aboutUs")}
              </Link>
              <Link to="/pricing-terms" className="text-xs sm:text-sm text-[#424843] hover:text-[#7b5800] transition-colors">
                {t("pricingPaymentTerms")}
              </Link>
              <Link to="/register" className="text-xs sm:text-sm text-[#424843] hover:text-[#7b5800] transition-colors">
                {t("machineListing")}
              </Link>
              <Link to="/login" className="text-xs sm:text-sm text-[#424843] hover:text-[#7b5800] transition-colors">
                {t("farmerSupport")}
              </Link>
            </div>

            {/* Column 3: Legal & Zoho Policies */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-[#082717] mb-1">{t("legal")}</p>
              <Link to="/terms" className="text-xs sm:text-sm text-[#424843] hover:text-[#7b5800] transition-colors">
                {t("termsOfService")}
              </Link>
              <Link to="/privacy" className="text-xs sm:text-sm text-[#424843] hover:text-[#7b5800] transition-colors">
                {t("privacyPolicy")}
              </Link>
              <Link to="/refund-policy" className="text-xs sm:text-sm text-[#424843] hover:text-[#7b5800] transition-colors">
                {t("cancellationRefundPolicy")}
              </Link>
              <Link to="/refund-policy" className="text-xs sm:text-sm text-[#424843] hover:text-[#7b5800] transition-colors">
                {t("replacementPolicy")}
              </Link>
              <Link to="/legal" className="text-xs sm:text-sm text-[#424843] hover:text-[#7b5800] transition-colors">
                {t("legalDisclosures")}
              </Link>
            </div>

            {/* Column 4: Contact & Grievance */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-[#082717] mb-1">{t("connect")}</p>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#424843]">
                <Phone className="size-3.5 text-[#7b5800] shrink-0" />
                <span>+91 98765 43210 / +91 80023 45678</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#424843]">
                <Mail className="size-3.5 text-[#7b5800] shrink-0" />
                <a href="mailto:support@krishisanjha.in" className="hover:text-[#7b5800] underline">
                  support@krishisanjha.in
                </a>
              </div>
              <p className="text-xs text-[#737873] mt-1">
                {t("supportHours")}
              </p>
              <div className="mt-2 pt-2 border-t border-[#c2c8c1]/40 text-xs text-[#424843]">
                <span className="font-semibold block text-[#082717]">{t("grievanceOfficer")}:</span>
                <span>Mr. Pawan Kumar (grievance@krishisanjha.in)</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Currency Notice */}
          <div className="mt-8 pt-6 border-t border-[#c2c8c1]/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737873]">
            <p>{t("copyright")}</p>
            <div className="flex items-center gap-4">
              <span>Currency: <strong>INR (₹)</strong></span>
              <span>•</span>
              <span>Secure Gateway: <strong>Zoho Payments</strong></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
