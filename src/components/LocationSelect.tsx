import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface LocationValue {
  block_id: number | null;
  panchayat_id: number | null;
  village_id: number | null;
}

/** Cascading Block -> Panchayat -> Village dropdowns, fed by /locations/*. */
export function LocationSelect({
  value,
  onChange,
  needPanchayat = true,
  needVillage = true,
  errors,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  needPanchayat?: boolean;
  needVillage?: boolean;
  errors?: Partial<Record<keyof LocationValue, string>>;
}) {
  const { t, lang } = useI18n();

  const blocks = useQuery({ queryKey: ["blocks"], queryFn: api.blocks });
  const panchayats = useQuery({
    queryKey: ["panchayats", value.block_id],
    queryFn: () => api.panchayats(value.block_id!),
    enabled: value.block_id != null && needPanchayat,
  });
  const villages = useQuery({
    queryKey: ["villages", value.panchayat_id],
    queryFn: () => api.villages(value.panchayat_id!),
    enabled: value.panchayat_id != null && needVillage,
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="block">{t("block")}</Label>
        <Select
          value={value.block_id ? String(value.block_id) : undefined}
          onValueChange={(v) =>
            onChange({ block_id: Number(v), panchayat_id: null, village_id: null })
          }
        >
          <SelectTrigger id="block" className="w-full">
            <SelectValue placeholder={t("selectOption")} />
          </SelectTrigger>
          <SelectContent>
            {(blocks.data ?? []).map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {lang === "hi" ? b.name_hi : b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.block_id ? <p className="text-xs text-destructive">{errors.block_id}</p> : null}
      </div>

      {needPanchayat ? (
        <div className="space-y-1.5">
          <Label htmlFor="panchayat">{t("panchayat")}</Label>
          <Select
            value={value.panchayat_id ? String(value.panchayat_id) : undefined}
            onValueChange={(v) =>
              onChange({ ...value, panchayat_id: Number(v), village_id: null })
            }
            disabled={value.block_id == null}
          >
            <SelectTrigger id="panchayat" className="w-full">
              <SelectValue placeholder={t("selectOption")} />
            </SelectTrigger>
            <SelectContent>
              {(panchayats.data ?? []).map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.panchayat_id ? (
            <p className="text-xs text-destructive">{errors.panchayat_id}</p>
          ) : null}
        </div>
      ) : null}

      {needVillage ? (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="village">{t("village")}</Label>
          <Select
            value={value.village_id ? String(value.village_id) : undefined}
            onValueChange={(v) => onChange({ ...value, village_id: Number(v) })}
            disabled={value.panchayat_id == null}
          >
            <SelectTrigger id="village" className="w-full">
              <SelectValue placeholder={t("selectOption")} />
            </SelectTrigger>
            <SelectContent>
              {(villages.data ?? []).map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.name}
                  {v.ward ? ` · ${v.ward}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.village_id ? (
            <p className="text-xs text-destructive">{errors.village_id}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
