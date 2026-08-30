import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import { routeForUser } from "@/lib/routing";

export const Route = createFileRoute("/pending")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Application under review — Jamui Krishi Yantra Setu" },
      {
        name: "description",
        content:
          "Your Jamui Krishi Yantra Setu account is awaiting verification by your local panchayat, block or district officer.",
      },
      { property: "og:title", content: "Application under review" },
      {
        property: "og:description",
        content: "Track the verification status of your Jamui farm machinery account.",
      },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
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
    else if (user.account_status === "APPROVED")
      navigate({ to: routeForUser(user), replace: true });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </AppShell>
    );
  }

  const rejected = user.account_status === "REJECTED";

  return (
    <AppShell>
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>{rejected ? t("rejectedTitle") : t("pendingTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            {t("welcome")}, <span className="font-medium">{user.full_name}</span> · {t(user.role)}
          </p>
          {rejected ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
              {t("reason")}: {user.rejection_reason ?? "—"}
            </p>
          ) : (
            <p className="text-muted-foreground">{t("pendingBody")}</p>
          )}
          <p className="text-muted-foreground">
            {t("status")}: {t(user.account_status)} · {t("submittedOn")}:{" "}
            {new Date(user.submitted_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
