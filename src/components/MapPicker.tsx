import { Suspense, lazy, useEffect, useState } from "react";
import { MapPin, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const MapPickerImpl = lazy(() => import("./MapPickerImpl"));

export interface Coords {
  lat: number;
  lng: number;
}

export function MapPicker({
  value,
  onChange,
}: {
  value: Coords | null;
  onChange: (c: Coords) => void;
}) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => setMounted(true), []);

  const locate = () => {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        onChange({
          lat: Number(p.coords.latitude.toFixed(6)),
          lng: Number(p.coords.longitude.toFixed(6)),
        });
        setBusy(false);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <MapPin className="size-4 text-primary" aria-hidden />
          {t("location")}
        </span>
        <Button type="button" size="sm" variant="secondary" onClick={locate} disabled={busy}>
          <Crosshair className="size-4" aria-hidden />
          {t("useGps")}
        </Button>
      </div>
      <div className="h-56 overflow-hidden rounded-lg border border-border bg-muted">
        {mounted ? (
          <Suspense
            fallback={
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                {t("loading")}
              </div>
            }
          >
            <MapPickerImpl value={value} onChange={(lat, lng) => onChange({ lat, lng })} />
          </Suspense>
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            {t("loading")}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {value ? `${value.lat}, ${value.lng}` : "—"}
      </p>
    </div>
  );
}
