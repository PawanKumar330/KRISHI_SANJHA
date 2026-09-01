import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Languages, Menu, X } from "lucide-react";
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF7F1]/85 dark:bg-[#1c1c18]/85 backdrop-blur-md border-b border-[#c2c8c1]/30 shadow-xs">
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
              className="text-sm font-medium text-[#7b5800] relative after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#7b5800] after:rounded-full"
            >
              {t("marketplace")}
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

      {/* Footer */}
      <footer className="mt-16 border-t border-[#c2c8c1]/30 bg-[#e5e2dc]/60">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 md:grid-cols-4 md:px-8">
          <div className="md:col-span-1 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#082717] text-3xl">
                agriculture
              </span>
              <span className="font-serif text-xl font-bold text-[#082717]">Krishi Sanjha</span>
            </div>
            <p className="text-xs text-[#424843]">{t("copyright")}</p>
            {OFFLINE_MODE ? (
              <p className="mt-2 text-[11px] text-[#7b5800]">{t("offlineNote")}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-[#082717] mb-1">{t("platform")}</p>
            <Link to="/register" className="text-sm text-[#424843] hover:text-[#7b5800] transition-colors">
              {t("machineListing")}
            </Link>
            <Link to="/login" className="text-sm text-[#424843] hover:text-[#7b5800] transition-colors">
              {t("farmerSupport")}
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-[#082717] mb-1">{t("legal")}</p>
            <span className="text-sm text-[#424843] hover:text-[#7b5800] cursor-pointer transition-colors">
              {t("privacyPolicy")}
            </span>
            <span className="text-sm text-[#424843] hover:text-[#7b5800] cursor-pointer transition-colors">
              {t("termsOfService")}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-[#082717] mb-1">{t("connect")}</p>
            <span className="text-sm text-[#424843] hover:text-[#7b5800] cursor-pointer transition-colors">
              Contact Us: info@krishisanjha.in
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
