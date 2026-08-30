import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { LocationSelect } from "@/components/LocationSelect";
import { MapPicker, type Coords } from "@/components/MapPicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import { registerSchema } from "@/lib/schemas";
import { ROLES, type Role } from "@/lib/types";
import { writeToken } from "@/lib/api";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Register — Jamui Krishi Yantra Setu" },
      {
        name: "description",
        content:
          "Create a farmer, equipment owner, operator or administrator account for Jamui district and submit it for local verification.",
      },
      { property: "og:title", content: "Register — Jamui Krishi Yantra Setu" },
      {
        property: "og:description",
        content: "Submit your application for panchayat, block or district verification.",
      },
    ],
  }),
  component: RegisterPage,
});

const SELF_SERVE_ROLES = ROLES.filter((r) => r !== "DISTRICT_ADMIN");

function RegisterPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const setUser = useAuth((s) => s.setUser);

  const [role, setRole] = useState<Role>("FARMER");
  const [fields, setFields] = useState({
    full_name: "",
    user_id: "",
    password: "",
    confirm_password: "",
  });
  const [loc, setLoc] = useState({
    block_id: null as number | null,
    panchayat_id: null as number | null,
    village_id: null as number | null,
  });
  const [coords, setCoords] = useState<Coords | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const needPanchayat = role !== "DISTRICT_ADMIN";
  const needVillage = role !== "DISTRICT_ADMIN" && role !== "BLOCK_ADMIN";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse({
      role,
      ...fields,
      block_id: loc.block_id ?? 0,
      panchayat_id: loc.panchayat_id,
      village_id: loc.village_id,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const { confirm_password: _c, ...payload } = parsed.data;
      const res = await api.register(payload);
      writeToken(res.token, true);
      setUser(res.user);
      navigate({ to: "/pending", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>{t("register")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">{t("role")}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SELF_SERVE_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setLoc({ ...loc, panchayat_id: null, village_id: null });
                    }}
                    aria-pressed={role === r}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition-colors ${
                      role === r
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {t(r)}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="full_name">{t("fullName")}</Label>
                <Input
                  id="full_name"
                  value={fields.full_name}
                  onChange={(e) => setFields({ ...fields, full_name: e.target.value })}
                />
                {errors["full_name"] ? (
                  <p className="text-xs text-destructive">{errors["full_name"]}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user_id">{t("userId")}</Label>
                <Input
                  id="user_id"
                  autoComplete="username"
                  value={fields.user_id}
                  onChange={(e) => setFields({ ...fields, user_id: e.target.value })}
                />
                {errors["user_id"] ? (
                  <p className="text-xs text-destructive">{errors["user_id"]}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={fields.password}
                  onChange={(e) => setFields({ ...fields, password: e.target.value })}
                />
                {errors["password"] ? (
                  <p className="text-xs text-destructive">{errors["password"]}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm_password">{t("confirmPassword")}</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  value={fields.confirm_password}
                  onChange={(e) => setFields({ ...fields, confirm_password: e.target.value })}
                />
                {errors["confirm_password"] ? (
                  <p className="text-xs text-destructive">{errors["confirm_password"]}</p>
                ) : null}
              </div>
            </div>

            <LocationSelect
              value={loc}
              onChange={setLoc}
              needPanchayat={needPanchayat}
              needVillage={needVillage}
              errors={errors as never}
            />

            <MapPicker value={coords} onChange={setCoords} />

            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? t("loading") : t("submit")}
            </Button>
            <p className="text-center text-sm">
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                {t("haveAccount")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
