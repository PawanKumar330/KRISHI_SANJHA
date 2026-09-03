import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  Building2,
  Tractor,
  CheckCircle2,
  ChevronLeft,
  IdCard,
  IndianRupee,
  MapPin,
  Shield,
  Truck,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LocationSelect, type LocationValue } from "@/components/LocationSelect";
import { MapPicker, type Coords } from "@/components/MapPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/equipment/complete")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Complete Equipment Profile — Krishi Sanjha" },
      {
        name: "description",
        content:
          "Complete or update your Custom Hiring Center (CHC) enterprise and farm machinery details on Krishi Sanjha.",
      },
    ],
  }),
  component: CompleteEquipmentPage,
});

const EQUIPMENT_CATEGORIES = [
  "Tractor",
  "Power Tiller",
  "Combine Harvester",
  "Thresher / Paddy Thresher",
  "Rotavator",
  "Seed Drill / Multi-crop Planter",
  "Irrigation Pump",
  "Sprayer (Knapsack / Boom)",
  "Mini Truck / Trolley",
  "Paddy Transplanter",
  "Reaper / Binder",
  "Chaff Cutter",
  "Others",
];

const TRACTOR_MAKES = [
  "Mahindra",
  "TAFE",
  "Sonalika",
  "Eicher",
  "New Holland",
  "John Deere",
  "Swaraj",
  "Force",
  "Kubota",
  "Others",
];

const FUEL_TYPES = ["Diesel", "Petrol", "CNG / LPG", "Electric"];

function FormField({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id?: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-[#1c1c18]">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-[#424843] leading-relaxed">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function CompleteEquipmentPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const hydrate = useAuth((s) => s.hydrate);
  const queryClient = useQueryClient();

  // Route auth guard: Ensure hydration & role === 'EQUIPMENT_OWNER'
  useEffect(() => {
    if (!ready) void hydrate();
  }, [ready, hydrate]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate({ to: "/login", replace: true });
    } else if (user.role !== "EQUIPMENT_OWNER") {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [ready, user, navigate]);

  // Load existing enterprise and equipment rows
  const enterpriseQuery = useQuery({
    queryKey: ["my-enterprise"],
    queryFn: api.myEnterprise,
    enabled: ready && user?.role === "EQUIPMENT_OWNER",
  });

  const equipmentQuery = useQuery({
    queryKey: ["my-equipment"],
    queryFn: api.myEquipment,
    enabled: ready && user?.role === "EQUIPMENT_OWNER",
  });

  // Enterprise form fields
  const [enterpriseForm, setEnterpriseForm] = useState({
    business_name: "",
    registration_number: "",
    gst_number: "",
  });

  // Location & Coordinates for Enterprise
  const [loc, setLoc] = useState<LocationValue>({
    block_id: null,
    panchayat_id: null,
    village_id: null,
  });
  const [coords, setCoords] = useState<Coords | null>(null);

  // Equipment form fields
  const [equipmentForm, setEquipmentForm] = useState({
    category: "",
    sub_category: "",
    tractor_make: "",
    make_model: "",
    hp_rating: "",
    hourly_rate: "",
    acre_rate: "",
    fuel_type: "",
    reg_number: "",
    transport_available: false,
    has_insurance: false,
  });

  const [formInitialized, setFormInitialized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successSaved, setSuccessSaved] = useState(false);

  // Pre-fill form when queries resolve
  useEffect(() => {
    if (formInitialized) return;
    if (enterpriseQuery.isSuccess && equipmentQuery.isSuccess && user) {
      const ent = enterpriseQuery.data;
      const eq = equipmentQuery.data;

      setEnterpriseForm({
        business_name: ent?.business_name ?? `${user.full_name}'s Equipment Services`,
        registration_number: ent?.registration_number ?? "",
        gst_number: ent?.gst_number ?? "",
      });

      setLoc({
        block_id: user.block_id ?? null,
        panchayat_id: user.panchayat_id ?? null,
        village_id: ent?.village_id ?? user.village_id ?? null,
      });

      if (ent?.latitude && ent?.longitude) {
        setCoords({ lat: Number(ent.latitude), lng: Number(ent.longitude) });
      } else if (user.latitude && user.longitude) {
        setCoords({ lat: Number(user.latitude), lng: Number(user.longitude) });
      }

      if (eq) {
        const isKnownTractorMake = TRACTOR_MAKES.includes(eq.sub_category || "");
        setEquipmentForm({
          category: eq.category ?? "",
          sub_category: eq.sub_category ?? "",
          tractor_make: isKnownTractorMake ? eq.sub_category : (eq.sub_category ? "Others" : ""),
          make_model: eq.make_model ?? "",
          hp_rating: eq.hp_rating != null ? String(eq.hp_rating) : "",
          hourly_rate: eq.hourly_rate != null ? String(eq.hourly_rate) : "",
          acre_rate: eq.acre_rate != null ? String(eq.acre_rate) : "",
          fuel_type: eq.fuel_type ?? "",
          reg_number: eq.reg_number ?? "",
          transport_available: Boolean(eq.transport_available),
          has_insurance: Boolean(eq.has_insurance),
        });
      }

      setFormInitialized(true);
    }
  }, [
    enterpriseQuery.isSuccess,
    enterpriseQuery.data,
    equipmentQuery.isSuccess,
    equipmentQuery.data,
    user,
    formInitialized,
  ]);

  if (!ready || !user || user.role !== "EQUIPMENT_OWNER") {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl py-12 px-4 text-center">
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        </div>
      </AppShell>
    );
  }

  const isLoadingData = enterpriseQuery.isPending || equipmentQuery.isPending;
  const isDataMissing = !enterpriseQuery.data && !equipmentQuery.data;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSuccessSaved(false);

    const validationErrors: Record<string, string> = {};
    if (!enterpriseForm.business_name.trim()) {
      validationErrors.business_name = "Business / Enterprise name is required";
    }
    if (!equipmentForm.category) {
      validationErrors.category = "Please select an equipment category";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      setServerError(firstError);
      toast.error(firstError);
      return;
    }

    setErrors({});
    setBusy(true);

    try {
      const subCategoryValue =
        equipmentForm.category === "Tractor"
          ? (equipmentForm.tractor_make === "Others"
              ? equipmentForm.sub_category
              : equipmentForm.tractor_make) || equipmentForm.sub_category
          : equipmentForm.sub_category;

      await api.saveMyEquipmentProfile({
        enterprise: {
          business_name: enterpriseForm.business_name.trim(),
          registration_number: enterpriseForm.registration_number.trim() || undefined,
          gst_number: enterpriseForm.gst_number.trim() || undefined,
          village_id: loc.village_id ? Number(loc.village_id) : undefined,
          latitude: coords?.lat ?? undefined,
          longitude: coords?.lng ?? undefined,
        },
        equipment: {
          category: equipmentForm.category,
          sub_category: subCategoryValue.trim() || undefined,
          make_model: equipmentForm.make_model.trim() || undefined,
          hp_rating: equipmentForm.hp_rating ? Number(equipmentForm.hp_rating) : undefined,
          hourly_rate: equipmentForm.hourly_rate ? Number(equipmentForm.hourly_rate) : undefined,
          acre_rate: equipmentForm.acre_rate ? Number(equipmentForm.acre_rate) : undefined,
          fuel_type: equipmentForm.fuel_type || undefined,
          reg_number: equipmentForm.reg_number.trim() || undefined,
          transport_available: Boolean(equipmentForm.transport_available),
          has_insurance: Boolean(equipmentForm.has_insurance),
        },
      });

      setSuccessSaved(true);
      toast.success("Equipment profile saved successfully!");
      await queryClient.invalidateQueries({ queryKey: ["my-enterprise"] });
      await queryClient.invalidateQueries({ queryKey: ["my-equipment"] });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to save equipment profile";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-6 px-4 pb-20 space-y-6">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#082717] to-[#1f3d2b] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center text-xs text-[#a9d0b3] hover:text-white transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center border border-white/25">
                <Tractor className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a9d0b3]">
                  Equipment Owner Portal · Jamui Krishi Yantra Setu
                </p>
                <h1 className="font-serif text-2xl font-bold leading-tight">
                  {isDataMissing ? "Complete Your Equipment Profile" : "Edit Equipment & Enterprise Profile"}
                </h1>
              </div>
            </div>
            <p className="mt-2 text-sm text-[#c8ebd1] max-w-xl">
              Provide your enterprise details and primary farm machinery specifications so farmers in your area can view rates and book equipment.
            </p>
          </div>
        </div>

        {/* Missing Info Alert Banner (if null) */}
        {!isLoadingData && isDataMissing && !successSaved && (
          <div className="rounded-2xl border border-[#ffcd6d] bg-[#fff8e6] p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#785600] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-[#785600]">
                  Your equipment details are missing
                </h3>
                <p className="text-xs text-[#785600]/90 mt-0.5">
                  Your account was approved without complete machinery details. Please fill in your enterprise and equipment information below — once submitted, your listing will be reviewed before it becomes visible to nearby farmers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Alert Banner */}
        {successSaved && (
          <div className="rounded-2xl border border-green-300 bg-green-50 p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-800">
                  Profile Saved Successfully!
                </h3>
                <p className="text-xs text-green-700 mt-0.5">
                  Your enterprise and machinery specifications have been updated in the system.
                </p>
              </div>
              <Button
                size="sm"
                asChild
                className="bg-[#1f3d2b] text-white hover:bg-[#082717] rounded-xl text-xs h-8"
              >
                <Link to="/dashboard">
                  Go to Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Server Error Alert Banner */}
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Unable to save equipment profile</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {isLoadingData ? (
          <div className="rounded-2xl border border-[#c2c8c1]/40 bg-white p-12 text-center text-sm text-[#424843]">
            <span className="inline-block w-6 h-6 border-2 border-[#1f3d2b]/30 border-t-[#1f3d2b] rounded-full animate-spin mb-2" />
            <p>{t("loading")}</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            {/* ── Section 1: Enterprise Details (chc_enterprises) ── */}
            <div className="bg-white rounded-2xl border border-[#c2c8c1]/40 shadow-sm overflow-hidden">
              <div className="bg-[#f6f3ed] px-6 py-4 border-b border-[#c2c8c1]/40">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1f3d2b]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#1f3d2b]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#082717] text-base">
                      1. Enterprise Details (Custom Hiring Center)
                    </h2>
                    <p className="text-xs text-[#424843] mt-0.5">
                      Business name and operating base for your equipment rental services.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <FormField
                  id="business_name"
                  label="Business / Enterprise Name"
                  required
                  hint="The name farmers will see when booking your machinery."
                  error={errors.business_name}
                >
                  <Input
                    id="business_name"
                    placeholder="e.g. Kisan Seva Kendra / Jamui Agri Fleet"
                    value={enterpriseForm.business_name}
                    onChange={(e) => {
                      setEnterpriseForm({ ...enterpriseForm, business_name: e.target.value });
                      if (errors.business_name) setErrors({ ...errors, business_name: "" });
                    }}
                    className="h-11 border-[#c2c8c1] focus:border-[#1f3d2b]"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    id="registration_number"
                    label="Business Registration Number (Optional)"
                    hint="MSME / Udyam / Cooperative registration number if available."
                  >
                    <Input
                      id="registration_number"
                      placeholder="e.g. UDYAM-BR-01-XXXX"
                      value={enterpriseForm.registration_number}
                      onChange={(e) =>
                        setEnterpriseForm({ ...enterpriseForm, registration_number: e.target.value })
                      }
                      className="h-11 border-[#c2c8c1] font-mono"
                    />
                  </FormField>

                  <FormField
                    id="gst_number"
                    label="GST Number (Optional)"
                    hint="15-digit GSTIN if registered."
                  >
                    <Input
                      id="gst_number"
                      placeholder="e.g. 10AAAAA0000A1Z5"
                      value={enterpriseForm.gst_number}
                      onChange={(e) =>
                        setEnterpriseForm({ ...enterpriseForm, gst_number: e.target.value.toUpperCase() })
                      }
                      className="h-11 border-[#c2c8c1] font-mono"
                    />
                  </FormField>
                </div>

                {/* Location Select (Block -> Panchayat -> Village) */}
                <div className="pt-2 border-t border-[#c2c8c1]/30">
                  <Label className="text-sm font-medium text-[#1c1c18] block mb-3">
                    Operating Base Location (Village)
                  </Label>
                  <LocationSelect
                    value={loc}
                    onChange={setLoc}
                    needPanchayat={true}
                    needVillage={true}
                  />
                </div>

                {/* Map Coordinates Picker */}
                <div className="pt-2">
                  <p className="text-sm font-medium text-[#1c1c18] mb-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#1f3d2b]" /> Mark Operating Base Coordinates (Optional)
                  </p>
                  <p className="text-xs text-[#424843] mb-3">
                    Enables accurate distance calculation when farmers search for nearby machinery.
                  </p>
                  <MapPicker value={coords} onChange={setCoords} />
                </div>
              </div>
            </div>

            {/* ── Section 2: Equipment Details (equipment) ── */}
            <div className="bg-white rounded-2xl border border-[#c2c8c1]/40 shadow-sm overflow-hidden">
              <div className="bg-[#f6f3ed] px-6 py-4 border-b border-[#c2c8c1]/40">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1f3d2b]/10 flex items-center justify-center">
                    <Tractor className="w-5 h-5 text-[#1f3d2b]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[#082717] text-base">
                      2. Equipment / Machinery Details
                    </h2>
                    <p className="text-xs text-[#424843] mt-0.5">
                      Specifications and rental pricing for your primary machinery.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <FormField
                      id="eq_category"
                      label="Equipment Category"
                      required
                      error={errors.category}
                    >
                      <Select
                        value={equipmentForm.category}
                        onValueChange={(v) => {
                          setEquipmentForm({ ...equipmentForm, category: v });
                          if (errors.category) setErrors({ ...errors, category: "" });
                        }}
                      >
                        <SelectTrigger id="eq_category" className="h-11 border-[#c2c8c1]">
                          <SelectValue placeholder="Select machinery type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {EQUIPMENT_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  </div>

                  {equipmentForm.category === "Tractor" && (
                    <FormField id="tractor_make" label="Tractor Brand / Make">
                      <Select
                        value={equipmentForm.tractor_make}
                        onValueChange={(v) =>
                          setEquipmentForm({
                            ...equipmentForm,
                            tractor_make: v,
                            sub_category: v === "Others" ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger id="tractor_make" className="h-11 border-[#c2c8c1]">
                          <SelectValue placeholder="Select brand..." />
                        </SelectTrigger>
                        <SelectContent>
                          {TRACTOR_MAKES.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>
                  )}

                  <FormField
                    id="make_model"
                    label="Make / Model Specification"
                    hint="e.g. Mahindra 275 DI, Sonalika DI-35, Kubota MU4501"
                  >
                    <Input
                      id="make_model"
                      placeholder="Brand & Model details"
                      value={equipmentForm.make_model}
                      onChange={(e) =>
                        setEquipmentForm({ ...equipmentForm, make_model: e.target.value })
                      }
                      className="h-11 border-[#c2c8c1]"
                    />
                  </FormField>

                  <FormField id="hp_rating" label="Engine Power (HP)">
                    <div className="relative">
                      <Input
                        id="hp_rating"
                        type="number"
                        placeholder="e.g. 45"
                        value={equipmentForm.hp_rating}
                        onChange={(e) =>
                          setEquipmentForm({ ...equipmentForm, hp_rating: e.target.value })
                        }
                        className="h-11 border-[#c2c8c1] pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#424843]">
                        HP
                      </span>
                    </div>
                  </FormField>

                  <FormField id="fuel_type" label="Fuel Type">
                    <Select
                      value={equipmentForm.fuel_type}
                      onValueChange={(v) => setEquipmentForm({ ...equipmentForm, fuel_type: v })}
                    >
                      <SelectTrigger id="fuel_type" className="h-11 border-[#c2c8c1]">
                        <SelectValue placeholder="Select fuel type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField
                    id="reg_number"
                    label="Registration Number (RC)"
                    hint="Vehicle registration number as printed on RC book."
                  >
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#424843]" />
                      <Input
                        id="reg_number"
                        placeholder="e.g. BR-35-AB-1234"
                        value={equipmentForm.reg_number}
                        onChange={(e) =>
                          setEquipmentForm({ ...equipmentForm, reg_number: e.target.value.toUpperCase() })
                        }
                        className="h-11 border-[#c2c8c1] pl-9 font-mono"
                      />
                    </div>
                  </FormField>
                </div>

                {/* Rental Pricing */}
                <div className="pt-2 border-t border-[#c2c8c1]/30">
                  <div className="flex items-center gap-2 mb-4">
                    <IndianRupee className="w-4 h-4 text-[#1f3d2b]" />
                    <h3 className="font-semibold text-[#082717] text-sm">Rental Pricing Rates</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField
                      id="hourly_rate"
                      label="Hourly Rate (₹ / Hour)"
                      hint="Rate charged per hour of machine operation."
                    >
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-[#424843]">
                          ₹
                        </span>
                        <Input
                          id="hourly_rate"
                          type="number"
                          placeholder="e.g. 600"
                          value={equipmentForm.hourly_rate}
                          onChange={(e) =>
                            setEquipmentForm({ ...equipmentForm, hourly_rate: e.target.value })
                          }
                          className="h-11 border-[#c2c8c1] pl-8 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#424843]">
                          /hr
                        </span>
                      </div>
                    </FormField>

                    <FormField
                      id="acre_rate"
                      label="Per Acre Rate (₹ / Acre)"
                      hint="Rate charged per acre of farmland worked."
                    >
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-[#424843]">
                          ₹
                        </span>
                        <Input
                          id="acre_rate"
                          type="number"
                          placeholder="e.g. 1200"
                          value={equipmentForm.acre_rate}
                          onChange={(e) =>
                            setEquipmentForm({ ...equipmentForm, acre_rate: e.target.value })
                          }
                          className="h-11 border-[#c2c8c1] pl-8 pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#424843]">
                          /ac
                        </span>
                      </div>
                    </FormField>
                  </div>
                </div>

                {/* Additional Service Toggles */}
                <div className="space-y-3 pt-2 border-t border-[#c2c8c1]/30">
                  <h3 className="font-semibold text-[#082717] text-sm">Additional Service Capabilities</h3>
                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#c2c8c1]/50 cursor-pointer hover:bg-[#f6f3ed] transition-colors">
                    <Checkbox
                      checked={equipmentForm.transport_available}
                      onCheckedChange={(c) =>
                        setEquipmentForm({ ...equipmentForm, transport_available: Boolean(c) })
                      }
                      className="mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-[#1f3d2b]" />
                        <p className="text-sm font-medium text-[#082717]">Self-Transport Available</p>
                      </div>
                      <p className="text-xs text-[#424843] mt-0.5">
                        I can transport the machinery directly to the farmer's field location.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#c2c8c1]/50 cursor-pointer hover:bg-[#f6f3ed] transition-colors">
                    <Checkbox
                      checked={equipmentForm.has_insurance}
                      onCheckedChange={(c) =>
                        setEquipmentForm({ ...equipmentForm, has_insurance: Boolean(c) })
                      }
                      className="mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-[#1f3d2b]" />
                        <p className="text-sm font-medium text-[#082717]">Equipment Has Active Insurance</p>
                      </div>
                      <p className="text-xs text-[#424843] mt-0.5">
                        Valid third-party or comprehensive insurance is in effect for this machinery.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                asChild
                className="h-12 rounded-xl border-[#c2c8c1] text-[#424843]"
              >
                <Link to="/dashboard">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </Link>
              </Button>

              <Button
                type="submit"
                disabled={busy}
                className="flex-1 h-12 rounded-xl bg-[#1f3d2b] hover:bg-[#082717] text-white font-semibold text-base shadow-sm disabled:opacity-60"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving Profile...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Save Equipment Profile
                  </span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
