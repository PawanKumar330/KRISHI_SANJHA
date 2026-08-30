import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import { routeForUser } from "@/lib/routing";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — Jamui Krishi Yantra Setu" },
      {
        name: "description",
        content:
          "Manage your verified Jamui farm machinery profile: land records, equipment listings and operator details.",
      },
      { property: "og:title", content: "Dashboard — Jamui Krishi Yantra Setu" },
      {
        property: "og:description",
        content: "Your verified account home for farm machinery sharing in Jamui district.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const hydrate = useAuth((s) => s.hydrate);

  useEffect(() => {
    if (!ready) void hydrate();
  }, [ready, hydrate]);

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login", replace: true });
    else {
      const target = routeForUser(user);
      if (target !== "/dashboard") navigate({ to: target, replace: true });
    }
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold">
        {t("welcome")}, {user.full_name}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            {t("role")}: {t(user.role)}
          </p>
          <p>
            {t("status")}: {t(user.account_status)}
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
