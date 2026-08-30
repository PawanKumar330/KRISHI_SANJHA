import { Link, useNavigate } from "@tanstack/react-router";
import { Tractor, LogOut, Languages } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import { OFFLINE_MODE } from "@/lib/api";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <Tractor className="size-5" aria-hidden />
            </span>
            <span className="truncate text-sm font-semibold leading-tight sm:text-base">
              {t("appName")}
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              aria-label="Switch language"
            >
              <Languages className="size-4" aria-hidden />
              {lang === "en" ? "हिन्दी" : "English"}
            </Button>
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  signOut();
                  navigate({ to: "/login", replace: true });
                }}
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">{t("logout")}</span>
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link to="/login">{t("login")}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

      <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
        {OFFLINE_MODE ? `${t("offlineNote")} · ` : ""}
        {t("appName")}
      </footer>
    </div>
  );
}
