import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import { routeForUser } from "@/lib/routing";
import { SOIL_TYPES, normalizeArea } from "@/lib/schemas";
import type { AppUser } from "@/lib/types";

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
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 space-y-8">
        {/* Welcome header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#082717]">
              {t("welcome")}, {user.full_name}
            </h1>
            <p className="mt-1 text-sm text-[#424843]">
              {t(
                user.role === "EQUIPMENT_OWNER"
                  ? "ownerDashIntro"
                  : user.role === "OPERATOR"
                    ? "operatorDashIntro"
                    : "farmerDashIntro"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#1f3d2b] text-white hover:bg-[#1f3d2b]">{t(user.role)}</Badge>
            <Badge className="bg-[#ffcd6d] text-[#785600] hover:bg-[#ffcd6d]">
              {t(user.account_status)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ProfileCard user={user} />

          {user.role === "FARMER" ? (
            <>
              <LandPlotsCard userId={user.id} villageId={user.village_id} />
              <MachineryCard />
            </>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function ProfileCard({ user }: { user: AppUser }) {
  const { t, lang } = useI18n();

  const { data: block } = useQuery({
    queryKey: ["dash-block", user.block_id],
    queryFn: () => api.blocks(),
    staleTime: Infinity,
  });
  const blockName = useMemo(() => {
    if (!block) return null;
    const b = block.find((x) => x.id === user.block_id);
    return b ? (lang === "hi" ? b.name_hi || b.name : b.name) : null;
  }, [block, user.block_id, lang]);

  const { data: panchayat } = useQuery({
    queryKey: ["dash-panchayat", user.block_id],
    queryFn: () => api.panchayats(user.block_id),
    staleTime: Infinity,
  });
  const panchayatName = useMemo(
    () => panchayat?.find((x) => x.id === user.panchayat_id)?.name ?? null,
    [panchayat, user.panchayat_id]
  );

  const { data: village } = useQuery({
    queryKey: ["dash-village", user.panchayat_id],
    queryFn: () => api.villages(user.panchayat_id!),
    enabled: user.panchayat_id != null,
    staleTime: Infinity,
  });
  const villageName = useMemo(
    () => village?.find((x) => x.id === user.village_id)?.name ?? null,
    [village, user.village_id]
  );

  const location = [villageName, panchayatName, blockName].filter(Boolean).join(", ");

  const rows: Array<[string, string]> = [
    [t("userId"), user.user_id],
    [t("role"), t(user.role)],
    [t("phoneLabel"), user.phone ?? t("notProvided")],
    [t("fathersName"), user.father_name ?? t("notProvided")],
    [t("locationLabel"), location || t("notProvided")],
  ];

  return (
    <Card className="border-[#c2c8c1]/40">
      <CardHeader>
        <CardTitle className="font-serif text-[#082717]">{t("myProfile")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <dt className="text-[#424843]">{label}</dt>
              <dd className="font-medium text-right text-[#082717] break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function LandPlotsCard({ userId, villageId }: { userId: string; villageId: number | null }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ plot_name: "", bigha: "", katha: "", dhur: "", soil_type: "" });

  const { data: plots, isPending, error } = useQuery({
    queryKey: ["land-plots", userId],
    queryFn: () => api.landPlots(),
  });

  const totalDhur = (plots ?? []).reduce((sum, p) => sum + (p.bigha * 20 + p.katha) * 20 + p.dhur, 0);
  const total = normalizeArea(totalDhur / 400, 0, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bigha = Number(form.bigha || 0);
    const katha = Number(form.katha || 0);
    const dhur = Number(form.dhur || 0);
    if (!form.plot_name.trim() || bigha + katha + dhur <= 0) return;

    // The table stores Bigha + Katha (fractional), so Dhur rolls into Katha.
    const norm = normalizeArea(bigha, katha, dhur);
    setSaving(true);
    try {
      await api.addLandPlot({
        plot_name: form.plot_name.trim(),
        bigha: norm.bigha,
        katha: Number((norm.katha + norm.dhur / 20).toFixed(3)),
        soil_type: form.soil_type,
        village_id: villageId,
      });
      toast.success(t("myLand"));
      setForm({ plot_name: "", bigha: "", katha: "", dhur: "", soil_type: "" });
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["land-plots", userId] });
    } catch {
      toast.error(t("errGeneric"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-[#c2c8c1]/40 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="font-serif text-[#082717]">{t("myLand")}</CardTitle>
          <p className="mt-1 text-xs text-[#424843]">{t("myLandBody")}</p>
        </div>
        {!open && (
          <Button
            size="sm"
            onClick={() => setOpen(true)}
            className="rounded-full bg-[#1f3d2b] text-white hover:bg-[#1f3d2b]/90"
          >
            {t("addPlotBtn")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {open && (
          <form onSubmit={submit} className="space-y-3 rounded-xl border border-[#c2c8c1]/40 bg-[#f6f3ed] p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="plot_name">{t("plotName")}</Label>
                <Input
                  id="plot_name"
                  value={form.plot_name}
                  onChange={(e) => setForm({ ...form, plot_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t("soilLabel")}</Label>
                <Select value={form.soil_type} onValueChange={(v) => setForm({ ...form, soil_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectOption")} />
                  </SelectTrigger>
                  <SelectContent>
                    {SOIL_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["bigha", "katha", "dhur"] as const).map((unit) => (
                <div key={unit} className="space-y-1">
                  <Label htmlFor={unit}>{t(unit)}</Label>
                  <Input
                    id={unit}
                    type="number"
                    min="0"
                    step="any"
                    value={form[unit]}
                    onChange={(e) => setForm({ ...form, [unit]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#424843]">
                {t("totalArea")}:{" "}
                {(() => {
                  const n = normalizeArea(
                    Number(form.bigha || 0),
                    Number(form.katha || 0),
                    Number(form.dhur || 0)
                  );
                  return `${n.bigha} ${t("bigha")} ${n.katha} ${t("katha")} ${n.dhur} ${t("dhur")}`;
                })()}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" size="sm" disabled={saving} className="bg-[#1f3d2b] text-white hover:bg-[#1f3d2b]/90">
                  {t("save")}
                </Button>
              </div>
            </div>
          </form>
        )}

        {isPending ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : error ? (
          <p className="text-sm text-red-600">{t("errGeneric")}</p>
        ) : (plots ?? []).length === 0 ? (
          <p className="text-sm text-[#424843]">{t("noPlots")}</p>
        ) : (
          <>
            <ul className="divide-y divide-[#c2c8c1]/30">
              {(plots ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-[#082717]">{p.plot_name}</p>
                    {p.soil_type ? <p className="text-xs text-[#424843]">{p.soil_type}</p> : null}
                  </div>
                  <p className="text-right text-[#082717] whitespace-nowrap">
                    {p.bigha} {t("bigha")} {p.katha} {t("katha")}
                  </p>
                </li>
              ))}
            </ul>
            <p className="rounded-lg bg-[#ffcd6d]/30 px-4 py-2 text-sm font-medium text-[#785600]">
              {t("totalArea")}: {total.bigha} {t("bigha")} {total.katha} {t("katha")} {total.dhur} {t("dhur")} ({totalDhur} {t("dhur")})
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MachineryCard() {
  const { t } = useI18n();

  const { data: machines, isPending, error } = useQuery({
    queryKey: ["equipment-list"],
    queryFn: () => api.equipmentList(),
  });

  return (
    <Card className="border-[#c2c8c1]/40 lg:col-span-3">
      <CardHeader>
        <CardTitle className="font-serif text-[#082717]">{t("nearbyEquipment")}</CardTitle>
        <p className="mt-1 text-xs text-[#424843]">{t("nearbyEquipmentBody")}</p>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : error ? (
          <p className="text-sm text-[#424843]">{t("noEquipment")}</p>
        ) : (machines ?? []).length === 0 ? (
          <p className="text-sm text-[#424843]">{t("noEquipment")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(machines ?? []).map((m) => (
              <div key={m.id} className="rounded-xl border border-[#c2c8c1]/40 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7b5800]">agriculture</span>
                  <p className="font-medium text-[#082717] leading-tight">{m.make_model || m.category}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="border-[#c2c8c1] text-[#424843]">
                    {m.category}
                  </Badge>
                  {m.hp_rating ? (
                    <Badge variant="outline" className="border-[#c2c8c1] text-[#424843]">
                      {m.hp_rating} HP
                    </Badge>
                  ) : null}
                </div>
                <div className="flex gap-4 text-sm font-medium text-[#082717]">
                  {m.hourly_rate != null && <span>₹{m.hourly_rate}{t("perHour")}</span>}
                  {m.acre_rate != null && <span>₹{m.acre_rate}{t("perAcre")}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
