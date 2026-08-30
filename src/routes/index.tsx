import { createFileRoute, Link } from "@tanstack/react-router";
import { Coins, Clock, Search, TrendingUp, HandHeart } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Krishi Sanjha — Farm Machinery Sharing in Bihar" },
      {
        name: "description",
        content:
          "Krishi Sanjha connects farmers, equipment owners and operators across Bihar. Find nearby tractors and machines, or earn from your idle equipment.",
      },
      { property: "og:title", content: "Krishi Sanjha — Share Machines. Grow Together." },
      {
        property: "og:description",
        content: "Peer-to-peer farm machinery sharing for rural Bihar, starting with Jamui district.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const PROBLEMS: { icon: typeof Coins; t: TKey; b: TKey }[] = [
  { icon: Coins, t: "p1t", b: "p1b" },
  { icon: Clock, t: "p2t", b: "p2b" },
  { icon: Search, t: "p3t", b: "p3b" },
  { icon: TrendingUp, t: "p4t", b: "p4b" },
];

const STEPS: { t: TKey; b: TKey }[] = [
  { t: "s1t", b: "s1b" },
  { t: "s2t", b: "s2b" },
  { t: "s3t", b: "s3b" },
  { t: "s4t", b: "s4b" },
];

function FieldArt() {
  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border"
      aria-hidden
    >
      <div className="absolute inset-0 bg-sky" />
      <div className="absolute right-[12%] top-[12%] size-16 rounded-full bg-accent sm:size-20" />
      <div className="absolute inset-x-0 bottom-0 h-[62%] rounded-t-[100%_60px] bg-field" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-primary/80" />
      <span className="absolute bottom-[38%] left-1/3 text-4xl sm:text-5xl">🚜</span>
    </div>
  );
}

function Home() {
  const { t } = useI18n();

  return (
    <AppShell>
      <section className="grid items-center gap-8 py-4 sm:py-8 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            🌾 {t("heroBadge")}
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-primary sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">{t("heroBody")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/register">{t("findEquipment")}</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">{t("listEquipment")}</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold">
            {[t("FARMER"), t("appName"), t("EQUIPMENT_OWNER")].map((label, i) => (
              <span key={label} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground">→</span>}
                <span className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                  {label}
                </span>
              </span>
            ))}
          </div>
        </div>
        <FieldArt />
      </section>

      <section className="py-10">
        <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          {t("problemTitle")}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map(({ icon: Icon, t: title, b }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 font-semibold">
                <Icon className="size-4 text-primary" aria-hidden />
                {t(title)}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t(b)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="-mx-4 bg-cream px-4 py-10 sm:rounded-2xl sm:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          {t("howTitle")}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ t: title, b }, i) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5">
              <span className="grid size-8 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">{t(title)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(b)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-gradient-to-r from-secondary to-cream p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {t("ownersLabel")}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight text-primary sm:text-2xl">
            {t("ownersTitle")}
          </h2>
          <Button asChild>
            <Link to="/register">{t("listEquipment")}</Link>
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t("ownersBody")}</p>
      </section>

      <section className="mt-6 mb-4 rounded-2xl border border-border bg-gradient-to-r from-cream to-secondary p-6 sm:p-8">
        <span className="grid size-10 place-items-center rounded-full bg-card">
          <HandHeart className="size-5 text-primary" aria-hidden />
        </span>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight text-primary sm:text-2xl">
            {t("saathiTitle")}
          </h2>
          <Button variant="default" asChild>
            <Link to="/login">{t("saathiCta")}</Link>
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t("saathiBody")}</p>
      </section>
    </AppShell>
  );
}
