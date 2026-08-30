import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import { routeForUser } from "@/lib/routing";

export const Route = createFileRoute("/verification")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Verification console — Jamui Krishi Yantra Setu" },
      {
        name: "description",
        content:
          "Village, block and district officers review and approve Jamui farm machinery account applications.",
      },
      { property: "og:title", content: "Verification console" },
      {
        property: "og:description",
        content: "Approve or reject pending applications within your jurisdiction.",
      },
    ],
  }),
  component: VerificationPage,
});

function VerificationPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const hydrate = useAuth((s) => s.hydrate);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ready) void hydrate();
  }, [ready, hydrate]);

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login", replace: true });
    else {
      const target = routeForUser(user);
      if (target !== "/verification") navigate({ to: target, replace: true });
    }
  }, [ready, user, navigate]);

  const isDistrict = user?.role === "DISTRICT_ADMIN";
  const queue = useQuery({ queryKey: ["queue"], queryFn: api.queue, enabled: !!user });
  const audit = useQuery({ queryKey: ["audit"], queryFn: api.audit, enabled: !!isDistrict });

  const decide = useMutation({
    mutationFn: ({ id, approve, reason }: { id: string; approve: boolean; reason?: string }) =>
      api.decide(id, approve, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["queue"] });
      void qc.invalidateQueries({ queryKey: ["audit"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Action failed"),
  });

  if (!ready || !user) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </AppShell>
    );
  }

  const rows = queue.data ?? [];

  return (
    <AppShell>
      <h1 className="mb-4 text-xl font-semibold">
        {t("verification")} · {t(user.role)}
      </h1>

      {queue.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("queueEmpty")}</p>
      ) : (
        <div className="grid gap-4">
          {rows.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {a.full_name} · {t(a.role)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  {t("submittedOn")}: {new Date(a.submitted_at).toLocaleDateString()}
                </p>
                <Input
                  aria-label={t("rejectReason")}
                  placeholder={t("rejectReason")}
                  value={reasons[a.id] ?? ""}
                  onChange={(e) => setReasons({ ...reasons, [a.id]: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={decide.isPending}
                    onClick={() => decide.mutate({ id: a.id, approve: true })}
                  >
                    {t("approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={decide.isPending}
                    onClick={() => {
                      const reason = (reasons[a.id] ?? "").trim();
                      if (reason.length < 3) {
                        toast.error(t("rejectReason"));
                        return;
                      }
                      decide.mutate({ id: a.id, approve: false, reason });
                    }}
                  >
                    {t("reject")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isDistrict ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">{t("auditTitle")}</h2>
          <div className="grid gap-2">
            {(audit.data ?? []).map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
              >
                <span>
                  {a.full_name} · {t(a.role)}
                </span>
                <span className="text-muted-foreground">
                  {t("status")}: {t(a.account_status)}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
