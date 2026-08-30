import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-store";
import { loginSchema } from "@/lib/schemas";
import { useI18n } from "@/lib/i18n";
import { routeForUser } from "@/lib/routing";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Jamui Krishi Yantra Setu" },
      {
        name: "description",
        content: "Sign in with your User ID and password to manage your Jamui farm machinery account.",
      },
      { property: "og:title", content: "Sign in — Jamui Krishi Yantra Setu" },
      { property: "og:description", content: "Access your verified Jamui district account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const signIn = useAuth((s) => s.signIn);
  const [values, setValues] = useState({ user_id: "", password: "", remember: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const user = await signIn(parsed.data.user_id, parsed.data.password, !!values.remember);
      navigate({ to: routeForUser(user), replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>{t("login")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="user_id">{t("userId")}</Label>
              <Input
                id="user_id"
                autoComplete="username"
                inputMode="text"
                value={values.user_id}
                onChange={(e) => setValues({ ...values, user_id: e.target.value })}
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
                autoComplete="current-password"
                value={values.password}
                onChange={(e) => setValues({ ...values, password: e.target.value })}
              />
              {errors["password"] ? (
                <p className="text-xs text-destructive">{errors["password"]}</p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={values.remember}
                onCheckedChange={(c) => setValues({ ...values, remember: c === true })}
              />
              {t("remember")}
            </label>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? t("loading") : t("login")}
            </Button>
            <p className="text-center text-sm">
              <Link to="/register" className="text-primary underline-offset-4 hover:underline">
                {t("noAccount")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
