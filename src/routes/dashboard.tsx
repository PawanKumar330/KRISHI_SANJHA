import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  MapPin,
  Navigation,
  Phone,
  Shield,
  Tractor,
  Truck,
  Wrench,
} from "lucide-react";
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
import { PHONE_RE, SOIL_TYPES, normalizeArea } from "@/lib/schemas";
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

function getGpsCoords(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("geolocation unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 },
    );
  });
}

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

  const isFarmer = user.role === "FARMER";
  const isOwner = user.role === "EQUIPMENT_OWNER";

  const ownerEquipmentQuery = useQuery({
    queryKey: ["my-equipment"],
    queryFn: api.myEquipment,
    enabled: isOwner,
  });

  const ownerEnterpriseQuery = useQuery({
    queryKey: ["my-enterprise"],
    queryFn: api.myEnterprise,
    enabled: isOwner,
  });

  const isOwnerProfileMissing =
    isOwner && !ownerEquipmentQuery.isPending && !ownerEquipmentQuery.data;

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

        {/* Incomplete Equipment Profile Banner for Equipment Owners */}
        {isOwnerProfileMissing && (
          <div className="rounded-2xl border-2 border-[#ffcd6d] bg-[#fff8e6] p-5 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#ffcd6d]/50 p-2.5 text-[#785600] shrink-0">
                  <Tractor className="size-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#785600] text-base">
                    Incomplete Equipment Profile
                  </h3>
                  <p className="mt-0.5 text-xs text-[#785600]/90 max-w-2xl leading-relaxed">
                    Your enterprise and farm machinery details are missing. Complete your equipment profile so farmers across Jamui district can discover, view rates, and rent your machinery.
                  </p>
                </div>
              </div>
              <Button
                asChild
                className="bg-[#1f3d2b] text-white hover:bg-[#082717] rounded-xl font-medium shrink-0 h-10 px-5 shadow-xs"
              >
                <Link to="/equipment/complete">
                  Complete Equipment Profile <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ProfileCard user={user} />

          {isFarmer ? (
            <>
              <LandPlotsCard userId={user.id} villageId={user.village_id} />
              <NearestOwnersCard />
            </>
          ) : null}

          {isOwner ? (
            <OwnerEquipmentCard
              enterprise={ownerEnterpriseQuery.data}
              equipment={ownerEquipmentQuery.data}
              isLoading={ownerEquipmentQuery.isPending || ownerEnterpriseQuery.isPending}
            />
          ) : null}
        </div>

        {isFarmer ? <MachineryCard /> : null}
      </div>
    </AppShell>
  );
}

/** Saves a profile patch, then refreshes the signed-in user in the auth store. */
async function persistProfile(patch: Record<string, unknown>): Promise<void> {
  await api.saveProfile(patch);
  const me = await api.me();
  useAuth.getState().setUser(me);
}

function ProfileCard({ user }: { user: AppUser }) {
  const { t, lang } = useI18n();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyGps, setBusyGps] = useState(false);
  const [draft, setDraft] = useState({
    phone: user.phone ?? "",
    father_name: user.father_name ?? "",
    aadhaar_last4: user.aadhaar_last4 ?? "",
  });

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
  const coords =
    user.latitude != null && user.longitude != null
      ? `${user.latitude.toFixed(5)}, ${user.longitude.toFixed(5)}`
      : null;

  const missing =
    !user.phone || !user.father_name || !user.aadhaar_last4 || coords === null;

  // Auto-open the form while any detail is still missing.
  useEffect(() => {
    if (missing) setEditing(true);
  }, [missing]);

  const rows: Array<[string, string]> = [
    [t("userId"), user.user_id],
    [t("role"), t(user.role)],
    [t("phoneLabel"), user.phone ?? t("notProvided")],
    [t("fathersName"), user.father_name ?? t("notProvided")],
    [t("aadhaarLast4"), user.aadhaar_last4 ?? t("notProvided")],
    [t("locationLabel"), location || t("notProvided")],
    [t("coordinatesLabel"), coords ?? t("notProvided")],
  ];

  const captureGps = async () => {
    setBusyGps(true);
    try {
      const { lat, lng } = await getGpsCoords();
      await persistProfile({ latitude: lat, longitude: lng });
      toast.success(t("gpsSaved"));
    } catch {
      toast.error(t("gpsFailed"));
    } finally {
      setBusyGps(false);
    }
  };

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = draft.phone.trim();
    const aadhaar = draft.aadhaar_last4.trim();
    if (phone && !PHONE_RE.test(phone)) {
      toast.error(t("invalidPhone"));
      return;
    }
    if (aadhaar && !/^\d{4}$/.test(aadhaar)) {
      toast.error(t("invalidAadhaar"));
      return;
    }
    setSaving(true);
    try {
      await persistProfile({
        phone: phone || null,
        father_name: draft.father_name.trim() || null,
        aadhaar_last4: aadhaar || null,
      });
      toast.success(t("savedOk"));
      setEditing(false);
    } catch {
      toast.error(t("errGeneric"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-[#c2c8c1]/40">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="font-serif text-[#082717]">
            {missing ? t("completeProfile") : t("myProfile")}
          </CardTitle>
          {missing ? (
            <p className="mt-1 text-xs text-[#424843]">{t("completeProfileBody")}</p>
          ) : null}
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="rounded-full">
            {t("editDetails")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <form onSubmit={saveDetails} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="dash_phone">{t("phoneLabel")}</Label>
              <Input
                id="dash_phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="98XXXXXXXX"
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dash_father">{t("fathersName")}</Label>
              <Input
                id="dash_father"
                value={draft.father_name}
                onChange={(e) => setDraft({ ...draft, father_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dash_aadhaar">{t("aadhaarLast4")}</Label>
              <Input
                id="dash_aadhaar"
                inputMode="numeric"
                maxLength={4}
                placeholder="XXXX"
                value={draft.aadhaar_last4}
                onChange={(e) => setDraft({ ...draft, aadhaar_last4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              />
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-[#c2c8c1]/40 bg-[#f6f3ed] px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-xs text-[#424843]">
                <MapPin className="size-3.5 text-[#1f3d2b]" />
                {coords ?? t("needLocationFirst")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busyGps}
                onClick={captureGps}
                className="rounded-full"
              >
                <Navigation className="size-3.5 mr-1" />
                {t("useGps")}
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              {!missing && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  {t("cancel")}
                </Button>
              )}
              <Button type="submit" size="sm" disabled={saving} className="bg-[#1f3d2b] text-white hover:bg-[#1f3d2b]/90">
                {t("saveChanges")}
              </Button>
            </div>
          </form>
        ) : (
          <dl className="space-y-3 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <dt className="text-[#424843]">{label}</dt>
                <dd className="font-medium text-right text-[#082717] break-all">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

function NearestOwnersCard() {
  const { t } = useI18n();
  const user = useAuth((s) => s.user);
  const [busyGps, setBusyGps] = useState(false);

  const hasCoords = user?.latitude != null && user?.longitude != null;

  const { data: owners, isPending, error } = useQuery({
    queryKey: ["nearby-owners", user?.latitude, user?.longitude],
    queryFn: () => api.nearbyOwners(user!.latitude!, user!.longitude!),
    enabled: hasCoords,
  });

  const captureGps = async () => {
    setBusyGps(true);
    try {
      const { lat, lng } = await getGpsCoords();
      await persistProfile({ latitude: lat, longitude: lng });
      toast.success(t("gpsSaved"));
    } catch {
      toast.error(t("gpsFailed"));
    } finally {
      setBusyGps(false);
    }
  };

  const isRpcMissing =
    error != null && /does not exist|42883|PGRST202|schema cache/i.test(String((error as Error).message));

  return (
    <Card className="border-[#c2c8c1]/40 lg:col-span-3">
      <CardHeader>
        <CardTitle className="font-serif text-[#082717]">{t("ownersNearYou")}</CardTitle>
        <p className="mt-1 text-xs text-[#424843]">{t("ownersNearBody")}</p>
      </CardHeader>
      <CardContent>
        {!hasCoords ? (
          <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#c2c8c1]/40 bg-[#f6f3ed] px-4 py-3 sm:flex-row sm:items-center">
            <p className="text-sm text-[#424843]">{t("needLocationFirst")}</p>
            <Button
              size="sm"
              disabled={busyGps}
              onClick={captureGps}
              className="rounded-full bg-[#1f3d2b] text-white hover:bg-[#1f3d2b]/90"
            >
              <Navigation className="size-4 mr-1.5" />
              {t("useGps")}
            </Button>
          </div>
        ) : isPending ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : isRpcMissing ? (
          <p className="text-sm text-[#785600]">{t("rpcMissing")}</p>
        ) : error ? (
          <p className="text-sm text-[#424843]">{t("errGeneric")}</p>
        ) : (owners ?? []).length === 0 ? (
          <p className="text-sm text-[#424843]">{t("noOwnersNearby")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(owners ?? []).map((o) => (
              <div key={o.owner_id} className="rounded-xl border border-[#c2c8c1]/40 bg-white p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-[#082717] leading-tight">{o.full_name}</p>
                  {o.distance_km != null && (
                    <Badge variant="outline" className="border-[#1f3d2b]/40 text-[#1f3d2b] whitespace-nowrap">
                      {o.distance_km} {t("kmAway")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[#424843]">
                  {[o.village_name, o.panchayat_name, o.block_name].filter(Boolean).join(", ") || "—"}
                </p>
                {o.phone ? (
                  <a
                    href={`tel:${o.phone}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7b5800] hover:underline"
                  >
                    <Phone className="size-3.5" /> {o.phone}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
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

function OwnerEquipmentCard({
  enterprise,
  equipment,
  isLoading,
}: {
  enterprise: Record<string, any> | null | undefined;
  equipment: Record<string, any> | null | undefined;
  isLoading: boolean;
}) {
  const { t } = useI18n();

  return (
    <Card className="border-[#c2c8c1]/40 lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div>
          <CardTitle className="font-serif text-[#082717] flex items-center gap-2">
            <Tractor className="size-5 text-[#1f3d2b]" />
            My Machinery & Enterprise Profile
          </CardTitle>
          <p className="mt-1 text-xs text-[#424843]">
            Your registered Custom Hiring Center (CHC) machinery fleet & rental rates.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          asChild
          className="rounded-xl border-[#c2c8c1] text-xs h-8"
        >
          <Link to="/equipment/complete">
            {equipment ? "Edit Details" : t("completeProfile")}
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : !equipment && !enterprise ? (
          <div className="rounded-xl border border-dashed border-[#ffcd6d] bg-[#fff8e6] p-6 text-center space-y-3">
            <Tractor className="size-8 text-[#785600] mx-auto opacity-70" />
            <div>
              <p className="text-sm font-semibold text-[#785600]">
                No equipment details registered yet
              </p>
              <p className="text-xs text-[#785600]/80 mt-0.5 max-w-md mx-auto">
                Add your machinery type, specifications, and rental pricing so farmers can discover and book your services.
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-[#1f3d2b] text-white hover:bg-[#082717] rounded-xl font-medium text-xs h-8"
            >
              <Link to="/equipment/complete">
                Add Equipment Now &rarr;
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Enterprise Header */}
            {enterprise && (
              <div className="rounded-xl bg-[#f6f3ed] p-4 border border-[#c2c8c1]/40">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-[#1f3d2b]" />
                  <h4 className="font-semibold text-sm text-[#082717]">
                    {enterprise.business_name || "Enterprise"}
                  </h4>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#424843]">
                  {enterprise.registration_number && (
                    <span>Reg: <strong className="font-mono text-[#082717]">{enterprise.registration_number}</strong></span>
                  )}
                  {enterprise.gst_number && (
                    <span>GSTIN: <strong className="font-mono text-[#082717]">{enterprise.gst_number}</strong></span>
                  )}
                </div>
              </div>
            )}

            {/* Equipment Details */}
            {equipment && (
              <div className="rounded-xl border border-[#c2c8c1]/40 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#7b5800] text-xl">agriculture</span>
                    <h4 className="font-medium text-[#082717]">
                      {equipment.make_model || equipment.category}
                    </h4>
                  </div>
                  {equipment.hp_rating && (
                    <Badge variant="outline" className="border-[#c2c8c1] text-[#424843] text-xs">
                      {equipment.hp_rating} HP
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-[#1f3d2b]/10 text-[#1f3d2b] hover:bg-[#1f3d2b]/10 border-0">
                    {equipment.category}
                  </Badge>
                  {equipment.sub_category && (
                    <Badge variant="outline" className="border-[#c2c8c1] text-[#424843]">
                      {equipment.sub_category}
                    </Badge>
                  )}
                  {equipment.fuel_type && (
                    <Badge variant="outline" className="border-[#c2c8c1] text-[#424843]">
                      {equipment.fuel_type}
                    </Badge>
                  )}
                  {equipment.reg_number && (
                    <Badge variant="outline" className="border-[#c2c8c1] font-mono text-[#424843]">
                      RC: {equipment.reg_number}
                    </Badge>
                  )}
                </div>

                {/* Rates */}
                <div className="flex flex-wrap gap-4 pt-1 text-sm font-semibold text-[#082717] border-t border-[#c2c8c1]/20">
                  {equipment.hourly_rate != null && (
                    <span className="text-[#1f3d2b]">
                      ₹{equipment.hourly_rate} <span className="text-xs font-normal text-[#424843]">/ hour</span>
                    </span>
                  )}
                  {equipment.acre_rate != null && (
                    <span className="text-[#1f3d2b]">
                      ₹{equipment.acre_rate} <span className="text-xs font-normal text-[#424843]">/ acre</span>
                    </span>
                  )}
                </div>

                {/* Capabilities Badges */}
                <div className="flex flex-wrap gap-3 pt-1 text-xs text-[#424843]">
                  {equipment.transport_available && (
                    <span className="inline-flex items-center gap-1 text-[#1f3d2b]">
                      <Truck className="size-3.5" /> Self-Transport Available
                    </span>
                  )}
                  {equipment.has_insurance && (
                    <span className="inline-flex items-center gap-1 text-[#1f3d2b]">
                      <Shield className="size-3.5" /> Insured
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

