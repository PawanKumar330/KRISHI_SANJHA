import { createFileRoute, Link } from "@tanstack/react-router";
import { Tractor, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jamui Krishi Yantra Setu — Farm Machinery Sharing" },
      {
        name: "description",
        content:
          "Register as a farmer, equipment owner or operator in Jamui district and get verified by your local panchayat, block or district officer.",
      },
      { property: "og:title", content: "Jamui Krishi Yantra Setu" },
      {
        property: "og:description",
        content: "Peer-to-peer farm machinery sharing for Jamui district, Bihar.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useI18n();
  return (
    <AppShell>
      <section className="rounded-xl border border-border bg-card p-6 sm:p-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{t("appName")}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("tagline")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link to="/register">{t("register")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">{t("login")}</Link>
          </Button>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Users, key: "FARMER" as const },
          { icon: Tractor, key: "EQUIPMENT_OWNER" as const },
          { icon: ShieldCheck, key: "VILLAGE_ADMIN" as const },
        ].map(({ icon: Icon, key }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-3 py-5">
              <Icon className="size-5 text-primary" aria-hidden />
              <span className="font-medium">{t(key)}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
