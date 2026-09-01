import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  User,
  Tractor,
  Car,
  Shield,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Camera,
  FileText,
  Phone,
  MapPin,
  Lock,
  IdCard,
  Wrench,
  Clock,
  IndianRupee,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LocationSelect } from "@/components/LocationSelect";
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
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import { registerSchema } from "@/lib/schemas";
import type { Role } from "@/lib/types";
import { writeToken } from "@/lib/api";

export const Route = createFileRoute("/register")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Apply — Krishi Sanjha | Jamui Krishi Yantra Setu" },
      {
        name: "description",
        content:
          "Submit your registration for the Jamui Krishi Yantra Setu platform. Farmers, Equipment Owners, and Operators can apply for local government-verified accounts.",
      },
    ],
  }),
  component: RegisterPage,
});

const APPLICANT_ROLES: { value: Role; label: string; label_hi: string; icon: typeof User; desc: string }[] = [
  {
    value: "FARMER",
    label: "Farmer (Kisan)",
    label_hi: "किसान",
    icon: User,
    desc: "Access machinery listings, book equipment from nearby owners.",
  },
  {
    value: "EQUIPMENT_OWNER",
    label: "Equipment Owner (Yantra Malik)",
    label_hi: "यंत्र मालिक",
    icon: Tractor,
    desc: "List your machinery for rental, set rates, manage bookings.",
  },
  {
    value: "OPERATOR",
    label: "Operator / Driver (Chalak)",
    label_hi: "चालक / ऑपरेटर",
    icon: Car,
    desc: "Register as a certified operator, set availability and wage.",
  },
];

const EQUIPMENT_CATEGORIES = [
  "Tractor", "Power Tiller", "Combine Harvester", "Thresher / Paddy Thresher",
  "Rotavator", "Seed Drill / Multi-crop Planter", "Irrigation Pump",
  "Sprayer (Knapsack / Boom)", "Mini Truck / Trolley", "Paddy Transplanter",
  "Reaper / Binder", "Chaff Cutter", "Others",
];

const TRACTOR_MAKES = [
  "Mahindra", "TAFE", "Sonalika", "Eicher", "New Holland",
  "John Deere", "Swaraj", "Force", "Kubota", "Others",
];

function SectionHeader({ icon: Icon, title, subtitle }: { icon: typeof User; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1f3d2b]/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#1f3d2b]" />
      </div>
      <div>
        <h3 className="font-semibold text-[#082717] text-base">{title}</h3>
        {subtitle && <p className="text-xs text-[#424843] mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function FormField({
  id, label, required, hint, error, children,
}: {
  id?: string; label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-[#1c1c18]">
        {label}{required && <span className="text-red-600 ml-1">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-[#424843] leading-relaxed">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{error}
        </p>
      )}
    </div>
  );
}

function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
          i < step ? "bg-[#1f3d2b]" : i === step ? "bg-[#466551]" : "bg-[#c2c8c1]"
        }`} />
      ))}
    </div>
  );
}

function RegisterPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const setUser = useAuth((s) => s.setUser);

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role>("FARMER");

  const [personal, setPersonal] = useState({
    full_name: "", phone: "", father_name: "", aadhaar_last4: "",
  });

  const [account, setAccount] = useState({
    user_id: "", password: "", confirm_password: "",
  });

  const [loc, setLoc] = useState({
    block_id: null as number | null,
    panchayat_id: null as number | null,
    village_id: null as number | null,
  });
  const [coords, setCoords] = useState<Coords | null>(null);

  const [equipment, setEquipment] = useState({
    category: "", make_model: "", tractor_make: "", hp_rating: "",
    reg_number: "", fuel_type: "", hourly_rate: "", acre_rate: "",
    transport_available: false, has_insurance: false,
  });

  const [operator, setOperator] = useState({
    driving_license_no: "", license_type: "", experience_years: "",
    preferred_equipment: [] as string[], daily_wage: "", hourly_rate: "",
    vehicle_own: false, vehicle_type: "", vehicle_reg_no: "", availability: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const needPanchayat = role !== "DISTRICT_ADMIN";
  const needVillage = role !== "DISTRICT_ADMIN" && role !== "BLOCK_ADMIN";
  const totalSteps = role === "FARMER" ? 3 : 4;

  function nextStep() { setStep((s) => Math.min(s + 1, totalSteps - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function prevStep() { setStep((s) => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: "smooth" }); }

  const selectedRole = APPLICANT_ROLES.find((r) => r.value === role);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!agreedToTerms) { setServerError("Please accept the declaration to submit."); return; }

    const cleanedUserId = account.user_id.toLowerCase().trim();
    const parsed = registerSchema.safeParse({
      role,
      full_name: personal.full_name.trim(),
      user_id: cleanedUserId,
      password: account.password,
      confirm_password: account.confirm_password,
      block_id: loc.block_id ?? 0,
      panchayat_id: loc.panchayat_id,
      village_id: loc.village_id,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      phone: personal.phone,
      father_name: personal.father_name.trim() || undefined,
      aadhaar_last4: personal.aadhaar_last4 || undefined,
      equipment:
        role === "EQUIPMENT_OWNER"
          ? {
              category: equipment.category,
              sub_category: equipment.tractor_make || undefined,
              make_model: equipment.make_model,
              hp_rating: equipment.hp_rating ? Number(equipment.hp_rating) : undefined,
              hourly_rate: equipment.hourly_rate ? Number(equipment.hourly_rate) : undefined,
              acre_rate: equipment.acre_rate ? Number(equipment.acre_rate) : undefined,
            }
          : undefined,
      operator:
        role === "OPERATOR"
          ? {
              driving_license_no: operator.driving_license_no,
              experience_years: operator.experience_years ? Number(operator.experience_years) : 0,
              preferred_equipment_types: operator.preferred_equipment.length
                ? operator.preferred_equipment
                : [equipment.category || "General"],
              daily_wage: operator.daily_wage ? Number(operator.daily_wage) : 0,
            }
          : undefined,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      const firstError = parsed.error.issues[0]?.message ?? "Please check the form";
      toast.error(firstError); setServerError(firstError); return;
    }

    setErrors({}); setBusy(true);
    try {
      const { confirm_password: _c, ...rest } = parsed.data;
      const res = await api.register({ ...rest, latitude: rest.latitude ?? null, longitude: rest.longitude ?? null });
      writeToken(res.token, true);
      setUser(res.user);
      if ((res as { warning?: string | null }).warning) {
        toast.warning((res as { warning?: string }).warning);
      }
      toast.success("Application submitted! Awaiting verification from your local Grameen Mitra.");
      navigate({ to: "/pending", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setServerError(msg); toast.error(msg);
    } finally { setBusy(false); }
  }

  const isLastStep = (role === "FARMER" && step === 2) || (role !== "FARMER" && step === 3);
  const RoleIcon = selectedRole?.icon ?? User;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-4 pb-16">

        {/* Government Header */}
        <div className="bg-gradient-to-r from-[#082717] to-[#1f3d2b] rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center border border-white/25">
                <span className="material-symbols-outlined text-2xl">agriculture</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#a9d0b3]">
                  Government of Bihar · Agriculture Department
                </p>
                <h1 className="font-serif text-xl font-bold leading-tight">Jamui Krishi Yantra Setu</h1>
              </div>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-1">New Applicant Registration</h2>
            <p className="text-sm text-[#c8ebd1] max-w-lg">
              Complete this form to register. Your application will be reviewed by your local Grameen Mitra within 2–5 working days.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Aadhaar-linked verification", "Free to register", "Jamui District only"].map((label) => (
                <span key={label} className="inline-flex items-center gap-1 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs">
                  <Shield className="w-3 h-3" /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-[#c2c8c1]/40 p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#424843] uppercase tracking-wide">Step {step + 1} of {totalSteps}</span>
            <span className="text-xs text-[#082717] font-medium">
              {["Choose Applicant Type", "Personal Information", role !== "FARMER" ? "Role-Specific Details" : "Location & Account Setup", "Location & Account Setup"][step]}
            </span>
          </div>
          <StepBar step={step} total={totalSteps} />
        </div>

        {serverError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertTitle>Please correct the following</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} noValidate>

          {/* ── STEP 0: Role Selection ── */}
          {step === 0 && (
            <div className="bg-white rounded-2xl border border-[#c2c8c1]/40 shadow-sm overflow-hidden">
              <div className="bg-[#f6f3ed] px-6 py-4 border-b border-[#c2c8c1]/40">
                <h3 className="font-semibold text-[#082717]">Select Your Applicant Category</h3>
                <p className="text-xs text-[#424843] mt-0.5">Choose the category that best describes your role in agriculture.</p>
              </div>
              <div className="p-6 grid gap-4">
                {APPLICANT_ROLES.map(({ value: r, label, label_hi, icon: Icon, desc }) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                      role === r ? "border-[#1f3d2b] bg-[#1f3d2b]/5 shadow-sm" : "border-[#c2c8c1]/50 hover:border-[#1f3d2b]/40 hover:bg-[#f6f3ed]"
                    }`}
                  >
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${role === r ? "bg-[#1f3d2b] text-white" : "bg-[#f0eee8] text-[#424843]"}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#082717]">{label}</span>
                        <span className="text-[#424843] text-sm">· {label_hi}</span>
                        {role === r && <CheckCircle2 className="w-4 h-4 text-[#1f3d2b] ml-auto flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-[#424843] mt-1">{desc}</p>
                    </div>
                  </button>
                ))}
                <div className="p-4 bg-[#fff8e6] rounded-xl border border-[#ffcd6d]/50">
                  <p className="text-xs text-[#785600]">
                    <strong>Note:</strong> Administrative roles (Village Admin, Block Admin, District Admin) are provisioned by the district office and cannot be self-registered.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 space-y-3">
                <Button type="button" onClick={nextStep} className="w-full bg-[#1f3d2b] hover:bg-[#082717] text-white rounded-xl h-12 font-semibold">
                  Continue as {selectedRole?.label_hi} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <p className="text-center text-sm text-[#424843]">
                  Already registered? <Link to="/login" className="text-[#1f3d2b] font-semibold hover:underline">Login →</Link>
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-[#c2c8c1]/40 shadow-sm overflow-hidden">
              <div className="bg-[#f6f3ed] px-6 py-4 border-b border-[#c2c8c1]/40">
                <SectionHeader icon={User} title="Personal Information" subtitle="Enter your name and identification details exactly as in your official documents." />
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <FormField id="full_name" label="Full Name" required hint="As per Aadhaar / Bank records" error={errors.full_name}>
                    <Input id="full_name" placeholder="e.g. Ramesh Kumar Yadav" value={personal.full_name}
                      onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })}
                      className="h-11 border-[#c2c8c1] focus:border-[#1f3d2b]" />
                  </FormField>
                </div>
                <FormField id="father_name" label="Father's / Husband's Name" hint="Optional but recommended">
                  <Input id="father_name" placeholder="e.g. Suresh Kumar Yadav" value={personal.father_name}
                    onChange={(e) => setPersonal({ ...personal, father_name: e.target.value })}
                    className="h-11 border-[#c2c8c1]" />
                </FormField>
                <FormField id="phone" label="Mobile Number" required error={errors.phone}>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[#c2c8c1] bg-[#f6f3ed] text-sm text-[#424843]">
                      <Phone className="w-3.5 h-3.5 mr-1" />+91
                    </span>
                    <Input id="phone" type="tel" placeholder="98XXXXXXXX" value={personal.phone} maxLength={10}
                      onChange={(e) => setPersonal({ ...personal, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      className="h-11 rounded-l-none border-[#c2c8c1]" />
                  </div>
                </FormField>
                <div className="sm:col-span-2">
                  <FormField id="aadhaar_last4" label="Last 4 digits of Aadhaar" hint="Only the last 4 digits are collected for identity verification. Full Aadhaar is NOT stored.">
                    <div className="flex items-center gap-2">
                      <span className="text-[#c2c8c1] font-mono text-lg tracking-widest">XXXX – XXXX –</span>
                      <Input id="aadhaar_last4" placeholder="XXXX" value={personal.aadhaar_last4} maxLength={4}
                        onChange={(e) => setPersonal({ ...personal, aadhaar_last4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        className="h-11 w-24 font-mono text-center border-[#c2c8c1]" />
                    </div>
                  </FormField>
                </div>
                <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-[#f6f3ed] border border-[#c2c8c1]/40">
                  {selectedRole && <RoleIcon className="w-4 h-4 text-[#1f3d2b] mr-2" />}
                  <span className="text-sm text-[#082717]">Registering as: <strong>{selectedRole?.label}</strong></span>
                  <button type="button" onClick={() => setStep(0)} className="text-xs text-[#7b5800] underline ml-auto">Change</button>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <Button type="button" onClick={prevStep} variant="outline" className="flex-1 h-12 rounded-xl border-[#c2c8c1]">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button type="button" onClick={nextStep} className="flex-1 bg-[#1f3d2b] hover:bg-[#082717] text-white rounded-xl h-12 font-semibold">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Equipment Owner Details ── */}
          {step === 2 && role === "EQUIPMENT_OWNER" && (
            <div className="bg-white rounded-2xl border border-[#c2c8c1]/40 shadow-sm overflow-hidden">
              <div className="bg-[#f6f3ed] px-6 py-4 border-b border-[#c2c8c1]/40">
                <SectionHeader icon={Tractor} title="Equipment / Machinery Details" subtitle="Provide details of your primary agricultural equipment you wish to list for rental." />
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <FormField id="eq_cat" label="Equipment Category" required>
                      <Select value={equipment.category} onValueChange={(v) => setEquipment({ ...equipment, category: v })}>
                        <SelectTrigger className="h-11 border-[#c2c8c1]"><SelectValue placeholder="Select equipment type..." /></SelectTrigger>
                        <SelectContent>{EQUIPMENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormField>
                  </div>
                  {equipment.category === "Tractor" && (
                    <FormField label="Tractor Brand / Make" required>
                      <Select value={equipment.tractor_make} onValueChange={(v) => setEquipment({ ...equipment, tractor_make: v })}>
                        <SelectTrigger className="h-11 border-[#c2c8c1]"><SelectValue placeholder="Select brand..." /></SelectTrigger>
                        <SelectContent>{TRACTOR_MAKES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormField>
                  )}
                  <FormField id="make_model" label="Make / Model Name" required hint="e.g. Mahindra 275 DI, Sonalika DI-35">
                    <Input id="make_model" placeholder="Brand & model" value={equipment.make_model}
                      onChange={(e) => setEquipment({ ...equipment, make_model: e.target.value })} className="h-11 border-[#c2c8c1]" />
                  </FormField>
                  <FormField id="hp" label="Engine Power (HP)">
                    <div className="relative">
                      <Input id="hp" type="number" placeholder="e.g. 45" value={equipment.hp_rating}
                        onChange={(e) => setEquipment({ ...equipment, hp_rating: e.target.value })} className="h-11 border-[#c2c8c1] pr-12" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#424843]">HP</span>
                    </div>
                  </FormField>
                  <FormField id="fuel_type" label="Fuel Type">
                    <Select value={equipment.fuel_type} onValueChange={(v) => setEquipment({ ...equipment, fuel_type: v })}>
                      <SelectTrigger className="h-11 border-[#c2c8c1]"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {["Diesel", "Petrol", "CNG / LPG", "Electric"].map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField id="reg_no" label="Registration Number (RC)" hint="As on RC Book">
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#424843]" />
                      <Input id="reg_no" placeholder="BR-35-AB-1234" value={equipment.reg_number}
                        onChange={(e) => setEquipment({ ...equipment, reg_number: e.target.value.toUpperCase() })}
                        className="h-11 border-[#c2c8c1] pl-9 font-mono" />
                    </div>
                  </FormField>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <IndianRupee className="w-4 h-4 text-[#1f3d2b]" />
                    <h4 className="font-semibold text-[#082717]">Rental Pricing</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField id="hourly_rate" label="Hourly Rate (₹ / Hour)" hint="Rate charged per hour of usage">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-[#424843]">₹</span>
                        <Input id="hourly_rate" type="number" placeholder="e.g. 600" value={equipment.hourly_rate}
                          onChange={(e) => setEquipment({ ...equipment, hourly_rate: e.target.value })}
                          className="h-11 border-[#c2c8c1] pl-8 pr-12" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#424843]">/hr</span>
                      </div>
                    </FormField>
                    <FormField id="acre_rate" label="Per Acre Rate (₹ / Acre)" hint="Rate charged per acre of land worked">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-[#424843]">₹</span>
                        <Input id="acre_rate" type="number" placeholder="e.g. 1200" value={equipment.acre_rate}
                          onChange={(e) => setEquipment({ ...equipment, acre_rate: e.target.value })}
                          className="h-11 border-[#c2c8c1] pl-8 pr-12" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#424843]">/ac</span>
                      </div>
                    </FormField>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-dashed border-[#c2c8c1] bg-[#f6f3ed]/60 p-5">
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-[#466551] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#082717] text-sm">Equipment Photo Upload</p>
                      <p className="text-xs text-[#424843] mt-1">After your registration is approved, you'll be asked to upload equipment photos (front view, working condition, RC Book).</p>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {["Front Photo", "RC Book", "In Operation"].map((label) => (
                          <div key={label} className="rounded-lg bg-white border border-[#c2c8c1]/40 p-3 text-center">
                            <Camera className="w-5 h-5 text-[#c2c8c1] mx-auto mb-1" />
                            <p className="text-[10px] text-[#424843]">{label}</p>
                            <p className="text-[9px] text-[#c2c8c1]">Upload later</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-[#082717] text-sm">Additional Services</h4>
                  {[
                    { key: "transport_available" as const, title: "Self-Transport Available", desc: "I can bring the equipment to the farmer's field." },
                    { key: "has_insurance" as const, title: "Equipment is Insured", desc: "My machinery has valid insurance coverage." },
                  ].map(({ key, title, desc }) => (
                    <label key={key} className="flex items-start gap-3 p-3 rounded-lg border border-[#c2c8c1]/40 cursor-pointer hover:bg-[#f6f3ed]">
                      <Checkbox checked={equipment[key]} onCheckedChange={(c) => setEquipment({ ...equipment, [key]: !!c })} className="mt-0.5" />
                      <div><p className="text-sm font-medium text-[#082717]">{title}</p><p className="text-xs text-[#424843]">{desc}</p></div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <Button type="button" onClick={prevStep} variant="outline" className="flex-1 h-12 rounded-xl border-[#c2c8c1]"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button type="button" onClick={nextStep} className="flex-1 bg-[#1f3d2b] hover:bg-[#082717] text-white rounded-xl h-12 font-semibold">Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Operator Details ── */}
          {step === 2 && role === "OPERATOR" && (
            <div className="bg-white rounded-2xl border border-[#c2c8c1]/40 shadow-sm overflow-hidden">
              <div className="bg-[#f6f3ed] px-6 py-4 border-b border-[#c2c8c1]/40">
                <SectionHeader icon={Car} title="Operator / Driver Profile" subtitle="Provide your driving credentials and work details for farmer verification." />
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <FormField id="dl_no" label="Driving Licence Number" required hint="As printed on your Driving Licence card" error={errors.driving_license_no}>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#424843]" />
                        <Input id="dl_no" placeholder="e.g. BR-35-20200012345" value={operator.driving_license_no}
                          onChange={(e) => setOperator({ ...operator, driving_license_no: e.target.value.toUpperCase() })}
                          className="h-11 border-[#c2c8c1] pl-9 font-mono" />
                      </div>
                    </FormField>
                  </div>
                  <FormField id="lic_type" label="Licence Type / Category">
                    <Select value={operator.license_type} onValueChange={(v) => setOperator({ ...operator, license_type: v })}>
                      <SelectTrigger className="h-11 border-[#c2c8c1]"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {[["LMV", "LMV – Light Motor Vehicle"], ["HMV", "HMV – Heavy Motor Vehicle"], ["Tractor", "Tractor / Agricultural"], ["Transport", "Transport Vehicle"]].map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField id="exp_years" label="Years of Experience" required error={errors.experience_years}>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#424843]" />
                      <Input id="exp_years" type="number" placeholder="e.g. 5" value={operator.experience_years}
                        onChange={(e) => setOperator({ ...operator, experience_years: e.target.value })}
                        className="h-11 border-[#c2c8c1] pl-9 pr-16" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#424843]">years</span>
                    </div>
                  </FormField>
                </div>

                <FormField label="Equipment Types You Can Operate" required>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                    {["Tractor", "Power Tiller", "Combine Harvester", "Thresher", "Rotavator", "Sprayer", "Irrigation Pump", "Transplanter", "Others"].map((eq) => (
                      <label key={eq} className="flex items-center gap-2 p-2.5 rounded-lg border border-[#c2c8c1]/40 cursor-pointer hover:bg-[#f6f3ed] text-xs">
                        <Checkbox
                          checked={operator.preferred_equipment.includes(eq)}
                          onCheckedChange={(c) => setOperator({
                            ...operator,
                            preferred_equipment: c ? [...operator.preferred_equipment, eq] : operator.preferred_equipment.filter((e) => e !== eq),
                          })}
                        />
                        <span className="text-[#1c1c18]">{eq}</span>
                      </label>
                    ))}
                  </div>
                </FormField>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <IndianRupee className="w-4 h-4 text-[#1f3d2b]" />
                    <h4 className="font-semibold text-[#082717]">Wage / Rate Details</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField id="daily_wage" label="Daily Wage (₹ / Day)" required hint="Expected daily wage for 8–10 hrs of work" error={errors.daily_wage}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-[#424843]">₹</span>
                        <Input id="daily_wage" type="number" placeholder="e.g. 800" value={operator.daily_wage}
                          onChange={(e) => setOperator({ ...operator, daily_wage: e.target.value })} className="h-11 border-[#c2c8c1] pl-8 pr-12" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#424843]">/day</span>
                      </div>
                    </FormField>
                    <FormField id="op_hr_rate" label="Hourly Rate (₹ / Hour)" hint="Optional: rate for short-duration work">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-[#424843]">₹</span>
                        <Input id="op_hr_rate" type="number" placeholder="e.g. 120" value={operator.hourly_rate}
                          onChange={(e) => setOperator({ ...operator, hourly_rate: e.target.value })} className="h-11 border-[#c2c8c1] pl-8 pr-12" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#424843]">/hr</span>
                      </div>
                    </FormField>
                  </div>
                </div>

                <div>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-[#c2c8c1]/40 cursor-pointer hover:bg-[#f6f3ed]">
                    <Checkbox checked={operator.vehicle_own} onCheckedChange={(c) => setOperator({ ...operator, vehicle_own: !!c })} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#082717]">I own a vehicle / equipment</p>
                      <p className="text-xs text-[#424843]">Select if you have your own machinery in addition to operating for others.</p>
                    </div>
                  </label>
                  {operator.vehicle_own && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#f6f3ed] rounded-xl">
                      <FormField id="veh_type" label="Vehicle / Equipment Type">
                        <Input id="veh_type" placeholder="e.g. Tractor, Mini Truck" value={operator.vehicle_type}
                          onChange={(e) => setOperator({ ...operator, vehicle_type: e.target.value })} className="h-11 border-[#c2c8c1] bg-white" />
                      </FormField>
                      <FormField id="veh_reg" label="Registration Number (RC)">
                        <div className="relative">
                          <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#424843]" />
                          <Input id="veh_reg" placeholder="BR-XX-XX-XXXX" value={operator.vehicle_reg_no}
                            onChange={(e) => setOperator({ ...operator, vehicle_reg_no: e.target.value.toUpperCase() })}
                            className="h-11 border-[#c2c8c1] pl-9 font-mono bg-white" />
                        </div>
                      </FormField>
                    </div>
                  )}
                </div>

                <FormField id="avail" label="Availability" hint="Describe when you are available for work">
                  <Select value={operator.availability} onValueChange={(v) => setOperator({ ...operator, availability: v })}>
                    <SelectTrigger className="h-11 border-[#c2c8c1]"><SelectValue placeholder="Select availability..." /></SelectTrigger>
                    <SelectContent>
                      {[["full_time", "Full Time (Year Round)"], ["seasonal_kharif", "Seasonal – Kharif (June–Oct)"], ["seasonal_rabi", "Seasonal – Rabi (Nov–March)"], ["weekends", "Weekends / Part Time"], ["on_demand", "On Demand / As Needed"]].map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <div className="rounded-xl border-2 border-dashed border-[#c2c8c1] bg-[#f6f3ed]/60 p-5">
                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-[#466551] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#082717] text-sm">Profile & Document Upload</p>
                      <p className="text-xs text-[#424843] mt-1">After approval, upload your profile photo, DL scan, and training certificates. Required before appearing in farmer searches.</p>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {["Profile Photo", "DL Scan", "Certificate"].map((label) => (
                          <div key={label} className="rounded-lg bg-white border border-[#c2c8c1]/40 p-3 text-center">
                            <Camera className="w-5 h-5 text-[#c2c8c1] mx-auto mb-1" />
                            <p className="text-[10px] text-[#424843]">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <Button type="button" onClick={prevStep} variant="outline" className="flex-1 h-12 rounded-xl border-[#c2c8c1]"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button type="button" onClick={nextStep} className="flex-1 bg-[#1f3d2b] hover:bg-[#082717] text-white rounded-xl h-12 font-semibold">Continue <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {/* ── FINAL STEP: Location + Account ── */}
          {isLastStep && (
            <div className="space-y-5">
              {/* Location */}
              <div className="bg-white rounded-2xl border border-[#c2c8c1]/40 shadow-sm overflow-hidden">
                <div className="bg-[#f6f3ed] px-6 py-4 border-b border-[#c2c8c1]/40">
                  <SectionHeader icon={MapPin} title="Location Details" subtitle="Select your administrative location as per permanent address in Jamui district." />
                </div>
                <div className="p-6 space-y-5">
                  <LocationSelect value={loc} onChange={setLoc} needPanchayat={needPanchayat} needVillage={needVillage} errors={errors as never} />
                  <div>
                    <p className="text-sm font-medium text-[#1c1c18] mb-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#1f3d2b]" /> Mark Your Farm / Business Location (Optional)
                    </p>
                    <p className="text-xs text-[#424843] mb-3">Pin your exact location so farmers can find nearby equipment or operators.</p>
                    <MapPicker value={coords} onChange={setCoords} />
                  </div>
                </div>
              </div>

              {/* Account Setup */}
              <div className="bg-white rounded-2xl border border-[#c2c8c1]/40 shadow-sm overflow-hidden">
                <div className="bg-[#f6f3ed] px-6 py-4 border-b border-[#c2c8c1]/40">
                  <SectionHeader icon={Lock} title="Account Setup" subtitle="Create your login credentials for the Krishi Sanjha platform." />
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <FormField id="user_id" label="User ID (Portal Username)" required
                      hint="4–24 lowercase characters, start with a letter. Use only: a–z, 0–9, dot (.), underscore (_). Example: ramesh.kisan"
                      error={errors.user_id}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-[#424843]">@</span>
                        <Input id="user_id" autoComplete="username" placeholder="e.g. ramesh.kisan" value={account.user_id}
                          onChange={(e) => setAccount({ ...account, user_id: e.target.value.toLowerCase().replace(/\s+/g, ".") })}
                          className="h-11 border-[#c2c8c1] pl-8 font-mono focus:border-[#1f3d2b]" />
                      </div>
                    </FormField>
                  </div>
                  <FormField id="password" label="Password" required
                    hint="Minimum 8 characters · Must contain at least 1 letter and 1 number" error={errors.password}>
                    <Input id="password" type="password" autoComplete="new-password" placeholder="Create a strong password"
                      value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })}
                      className="h-11 border-[#c2c8c1] focus:border-[#1f3d2b]" />
                    {account.password.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {[account.password.length >= 8, /[A-Za-z]/.test(account.password), /\d/.test(account.password)].map((ok, i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${ok ? "bg-green-500" : "bg-[#c2c8c1]"}`} />
                        ))}
                      </div>
                    )}
                  </FormField>
                  <FormField id="confirm_password" label="Confirm Password" required error={errors.confirm_password}>
                    <Input id="confirm_password" type="password" autoComplete="new-password" placeholder="Re-enter your password"
                      value={account.confirm_password} onChange={(e) => setAccount({ ...account, confirm_password: e.target.value })}
                      className="h-11 border-[#c2c8c1] focus:border-[#1f3d2b]" />
                    {account.confirm_password.length > 0 && (
                      <p className={`text-xs flex items-center gap-1 ${account.password === account.confirm_password ? "text-green-600" : "text-red-600"}`}>
                        {account.password === account.confirm_password
                          ? <><CheckCircle2 className="w-3 h-3" /> Passwords match</>
                          : <><AlertCircle className="w-3 h-3" /> Passwords do not match</>}
                      </p>
                    )}
                  </FormField>
                </div>
              </div>

              {/* Declaration */}
              <div className="bg-[#fff8e6] rounded-2xl border border-[#ffcd6d]/60 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <FileText className="w-5 h-5 text-[#785600] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-[#785600]">Applicant Declaration</h4>
                    <p className="text-xs text-[#785600]/80 mt-1">घोषणा — Please read carefully before submitting</p>
                  </div>
                </div>
                <div className="bg-white/60 rounded-xl p-4 text-xs text-[#424843] leading-relaxed mb-4 border border-[#ffcd6d]/30">
                  <p className="mb-2">I hereby declare that all information provided in this application is true, accurate, and complete to the best of my knowledge. Any false information may result in rejection or cancellation of my account.</p>
                  <p className="text-[#785600]">मैं एतद् घोषित करता/करती हूँ कि इस आवेदन में दी गई सभी जानकारी सत्य, सटीक और पूर्ण है। किसी भी गलत सूचना के परिणामस्वरूप मेरा आवेदन अस्वीकृत हो सकता है।</p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={agreedToTerms} onCheckedChange={(c) => setAgreedToTerms(!!c)} className="mt-0.5" />
                  <span className="text-sm text-[#785600] leading-relaxed">
                    I have read and agree to the above declaration. I consent to local administration (Grameen Mitra / Block Office) verifying my credentials.
                  </span>
                </label>
              </div>

              {/* Submit buttons */}
              <div className="flex gap-3">
                <Button type="button" onClick={prevStep} variant="outline" className="flex-1 h-14 rounded-xl border-[#c2c8c1] text-base">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button type="submit" disabled={busy || !agreedToTerms}
                  className="flex-[2] h-14 rounded-xl bg-[#1f3d2b] hover:bg-[#082717] text-white font-semibold text-base disabled:opacity-60">
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting Application...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Submit Application
                    </span>
                  )}
                </Button>
              </div>

              <p className="text-center text-sm text-[#424843]">
                Already have an account?{" "}
                <Link to="/login" className="text-[#1f3d2b] font-semibold hover:underline">{t("haveAccount")}</Link>
              </p>
            </div>
          )}
        </form>
      </div>
    </AppShell>
  );
}
