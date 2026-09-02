import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  IdCard,
  Menu,
  Phone,
  Shield,
  Tractor,
  User,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useI18n } from "@/lib/i18n";
import { routeForUser } from "@/lib/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { AppUser } from "@/lib/types";

export const Route = createFileRoute("/verification")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Block Admin Verification Console — Krishi Sanjha" },
      {
        name: "description",
        content:
          "Official administrative verification console for Block, Village, and District officers in Jamui District, Bihar.",
      },
    ],
  }),
  component: VerificationConsolePage,
});

type TabKey = "logs" | "approvals" | "dashboard" | "notifications" | "reports";

function formatApplicantId(user: AppUser): string {
  if (!user.id) return `KS-2024-${user.user_id.slice(0, 4).toUpperCase()}`;
  const hex = user.id.replace(/-/g, "").slice(0, 4).toUpperCase();
  const year = user.submitted_at ? new Date(user.submitted_at).getFullYear() : 2024;
  return `KS-${year}-${hex}`;
}

function VerificationConsolePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  const hydrate = useAuth((s) => s.hydrate);
  const signOut = useAuth((s) => s.signOut);

  const [activeTab, setActiveTab] = useState<TabKey>("logs");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [villageFilter, setVillageFilter] = useState<string>("ALL");
  const [selectedApplicant, setSelectedApplicant] = useState<AppUser | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    if (!ready) void hydrate();
  }, [ready, hydrate]);

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate({ to: "/login", replace: true });
    else {
      const target = routeForUser(user);
      if (target !== "/verification") navigate({ to: target, replace: true });
    }
  }, [ready, user, navigate]);

  // Fetch all applicants in jurisdiction
  const historyQuery = useQuery({
    queryKey: ["admin-history"],
    queryFn: api.adminHistory,
    enabled: !!user,
  });

  // Fetch location reference data for the admin's block
  const blocksQuery = useQuery({
    queryKey: ["admin-blocks"],
    queryFn: api.blocks,
    enabled: !!user,
    staleTime: Infinity,
  });

  const panchayatsQuery = useQuery({
    queryKey: ["admin-panchayats", user?.block_id],
    queryFn: () => api.panchayats(user?.block_id ?? 1),
    enabled: !!user?.block_id,
    staleTime: Infinity,
  });

  // Fetch applicant detailed dossier when modal opens
  const applicantDetailQuery = useQuery({
    queryKey: ["applicant-details", selectedApplicant?.id],
    queryFn: () => api.applicantDetails(selectedApplicant!.id),
    enabled: !!selectedApplicant,
  });

  // Decision Mutation (Approve / Reject)
  const decideMutation = useMutation({
    mutationFn: ({ id, approve, reason }: { id: string; approve: boolean; reason?: string }) =>
      api.decide(id, approve, reason),
    onSuccess: (updated) => {
      toast.success(
        updated.account_status === "APPROVED"
          ? "Applicant approved successfully!"
          : "Applicant rejected."
      );
      void qc.invalidateQueries({ queryKey: ["admin-history"] });
      void qc.invalidateQueries({ queryKey: ["queue"] });
      void qc.invalidateQueries({ queryKey: ["audit"] });
      setSelectedApplicant(null);
      setRejectingId(null);
      setRejectionReason("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Action failed");
    },
  });

  if (!ready || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fbf9f4] text-[#414844] text-sm">
        <span className="w-5 h-5 border-2 border-[#012d1d]/30 border-t-[#012d1d] rounded-full animate-spin mr-2" />
        {t("loading")}
      </div>
    );
  }

  const allApplicants = historyQuery.data ?? [];
  const blockInfo = blocksQuery.data?.find((b) => b.id === user.block_id);
  const panchayatMap = new Map(panchayatsQuery.data?.map((p) => [p.id, p.name]));

  // Metrics for dashboard tab
  const totalCount = allApplicants.length;
  const pendingCount = allApplicants.filter((a) => a.account_status === "PENDING_APPROVAL").length;
  const approvedCount = allApplicants.filter((a) => a.account_status === "APPROVED").length;
  const rejectedCount = allApplicants.filter((a) => a.account_status === "REJECTED").length;

  const farmerCount = allApplicants.filter((a) => a.role === "FARMER").length;
  const ownerCount = allApplicants.filter((a) => a.role === "EQUIPMENT_OWNER").length;
  const operatorCount = allApplicants.filter((a) => a.role === "OPERATOR").length;

  // Filtered List
  const filteredApplicants = useMemo(() => {
    let list = allApplicants;

    if (activeTab === "approvals") {
      list = list.filter((a) => a.account_status === "PENDING_APPROVAL");
    }

    if (statusFilter !== "ALL") {
      list = list.filter((a) => a.account_status === statusFilter);
    }

    if (roleFilter !== "ALL") {
      list = list.filter((a) => a.role === roleFilter);
    }

    if (villageFilter !== "ALL") {
      list = list.filter((a) => String(a.panchayat_id) === villageFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((a) => {
        const idStr = formatApplicantId(a).toLowerCase();
        const name = a.full_name.toLowerCase();
        const username = a.user_id.toLowerCase();
        const phone = (a.phone || "").toLowerCase();
        return idStr.includes(q) || name.includes(q) || username.includes(q) || phone.includes(q);
      });
    }

    return list;
  }, [allApplicants, activeTab, statusFilter, roleFilter, villageFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / PAGE_SIZE));
  const paginatedApplicants = filteredApplicants.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="bg-[#fbf9f4] text-[#1b1c19] font-sans h-screen flex overflow-hidden antialiased">
      {/* ── Desktop & Mobile SideNavBar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#f0eee9] border-r border-[#c1c8c2] flex flex-col py-4 shrink-0 transition-transform duration-200 md:static md:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-xl font-bold text-[#012d1d] flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-[#1b4332]">agriculture</span>
              Krishi Sanjha
            </h1>
            <p className="text-[11px] font-medium tracking-wide text-[#414844] mt-0.5">
              {t(user.role)} Console
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden text-[#414844] p-1 rounded-md hover:bg-[#eae8e3]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <ul className="flex flex-col gap-1 px-3 flex-grow">
          <li>
            <button
              type="button"
              onClick={() => {
                setActiveTab("dashboard");
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-[#1b4332] text-white shadow-xs font-semibold"
                  : "text-[#414844] hover:bg-[#eae8e3]"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Dashboard</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                setActiveTab("approvals");
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "approvals"
                  ? "bg-[#1b4332] text-white shadow-xs font-semibold"
                  : "text-[#414844] hover:bg-[#eae8e3]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
                <span>Approvals</span>
              </div>
              {pendingCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#ffcd6d] text-[#785600]">
                  {pendingCount}
                </span>
              )}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                setActiveTab("notifications");
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "notifications"
                  ? "bg-[#1b4332] text-white shadow-xs font-semibold"
                  : "text-[#414844] hover:bg-[#eae8e3]"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              <span>Village Notifications</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                setActiveTab("logs");
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "logs"
                  ? "bg-[#1b4332] text-white shadow-xs font-semibold"
                  : "text-[#414844] hover:bg-[#eae8e3]"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">history_edu</span>
              <span>Verification Logs</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                setActiveTab("reports");
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "reports"
                  ? "bg-[#1b4332] text-white shadow-xs font-semibold"
                  : "text-[#414844] hover:bg-[#eae8e3]"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">assessment</span>
              <span>Reports</span>
            </button>
          </li>
        </ul>

        {/* Jurisdiction & User Footer */}
        <div className="mt-auto px-4 pt-4 border-t border-[#c1c8c2] space-y-3">
          <div className="rounded-xl bg-[#e4e2dd] p-3 text-xs">
            <p className="font-semibold text-[#012d1d] flex items-center gap-1.5 truncate">
              <Shield className="w-3.5 h-3.5 text-[#1b4332]" />
              {user.full_name}
            </p>
            <p className="text-[#414844] text-[11px] mt-0.5">
              {blockInfo ? `${blockInfo.name} Block` : "Jamui District"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              signOut();
              navigate({ to: "/login", replace: true });
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition-colors font-medium"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#fbf9f4] overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="bg-[#fbf9f4] h-16 border-b border-[#c1c8c2] flex justify-between items-center px-4 sticky top-0 z-40 md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="p-2 rounded-lg text-[#414844] hover:bg-[#f0eee9]"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-serif text-lg font-bold text-[#012d1d]">Krishi Sanjha</h1>
          <div className="w-8" />
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-auto p-4 md:p-8 space-y-6">
          {/* Header Title Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#012d1d]">
                {activeTab === "logs" && "Verification Logs"}
                {activeTab === "approvals" && "Pending Approvals Queue"}
                {activeTab === "dashboard" && "Jurisdiction Overview Dashboard"}
                {activeTab === "notifications" && "Village Activity Notifications"}
                {activeTab === "reports" && "Administrative Reports & Breakdown"}
              </h2>
              <p className="text-sm text-[#414844] mt-0.5">
                {activeTab === "logs" && "History of approved, reviewed, and pending farmer & equipment owner requests."}
                {activeTab === "approvals" && "Review and verify new applicant dossiers within your administrative block."}
                {activeTab === "dashboard" && "High-level metrics and statistics of all farmers and machinery in your jurisdiction."}
                {activeTab === "notifications" && "Recent registration events across local Panchayats."}
                {activeTab === "reports" && "Panchayat-level breakdown of farm mechanization coverage."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-[#c1ecd4] text-[#274e3d] text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#1b4332] animate-pulse" />
                Live Supabase Connected
              </span>
            </div>
          </div>

          {/* ── TAB 1: VERIFICATION LOGS / DATA TABLE ── */}
          {(activeTab === "logs" || activeTab === "approvals") && (
            <div className="space-y-4">
              {/* Controls Bar (Search & Filter Pills) */}
              <div className="bg-white border border-[#c1c8c2] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center shadow-xs">
                <div className="relative flex-grow w-full md:w-auto">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#717973] text-[20px]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search by Farmer Name, ID, or Username..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-[#c1c8c2] focus:border-[#012d1d] focus:outline-hidden text-sm text-[#1b1c19] placeholder:text-[#717973] transition-colors"
                  />
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                  {/* Village / Panchayat Select */}
                  <div className="relative">
                    <select
                      value={villageFilter}
                      onChange={(e) => {
                        setVillageFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="text-xs h-9 px-3 pr-8 rounded-full border border-[#c1c8c2] bg-white text-[#1b1c19] focus:outline-hidden focus:border-[#012d1d]"
                    >
                      <option value="ALL">All Panchayats</option>
                      {(panchayatsQuery.data ?? []).map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Select (if on logs tab) */}
                  {activeTab === "logs" && (
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="text-xs h-9 px-3 pr-8 rounded-full border border-[#c1c8c2] bg-white text-[#1b1c19] focus:outline-hidden focus:border-[#012d1d]"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="APPROVED">Approved</option>
                        <option value="PENDING_APPROVAL">Pending</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                  )}

                  {/* Role Select */}
                  <div className="relative">
                    <select
                      value={roleFilter}
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="text-xs h-9 px-3 pr-8 rounded-full border border-[#c1c8c2] bg-white text-[#1b1c19] focus:outline-hidden focus:border-[#012d1d]"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="FARMER">Farmers</option>
                      <option value="EQUIPMENT_OWNER">Equipment Owners</option>
                      <option value="OPERATOR">Operators</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white border border-[#c1c8c2] rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#c1c8c2] bg-[#f5f3ee]">
                        <th className="py-3 px-4 text-xs font-semibold text-[#414844] tracking-wider uppercase">
                          FARMER ID
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-[#414844] tracking-wider uppercase">
                          FARMER NAME
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-[#414844] tracking-wider uppercase">
                          ROLE
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-[#414844] tracking-wider uppercase">
                          VILLAGE / PANCHAYAT
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-[#414844] tracking-wider uppercase">
                          VERIFICATION DATE
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-[#414844] tracking-wider uppercase">
                          STATUS
                        </th>
                        <th className="py-3 px-4 text-xs font-semibold text-[#414844] tracking-wider uppercase text-right">
                          ACTION
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-[#c1c8c2]/50">
                      {historyQuery.isLoading ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#414844]">
                            <span className="inline-block w-5 h-5 border-2 border-[#012d1d]/30 border-t-[#012d1d] rounded-full animate-spin mb-1" />
                            <p className="text-xs">Loading applicants from Supabase...</p>
                          </td>
                        </tr>
                      ) : paginatedApplicants.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#414844]">
                            <span className="material-symbols-outlined text-4xl text-[#717973] mb-1">
                              inbox
                            </span>
                            <p className="font-semibold text-sm">No records found</p>
                            <p className="text-xs text-[#717973]">
                              Try adjusting your search query or filters.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedApplicants.map((applicant) => {
                          const panchayatName =
                            panchayatMap.get(applicant.panchayat_id ?? -1) ||
                            (applicant.panchayat_id ? `Panchayat ${applicant.panchayat_id}` : "—");
                          const submittedDate = applicant.submitted_at
                            ? new Date(applicant.submitted_at).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—";

                          return (
                            <tr
                              key={applicant.id}
                              className="hover:bg-[#f5f3ee] transition-colors h-14"
                            >
                              <td className="py-3 px-4 font-mono text-xs text-[#717973] font-medium">
                                {formatApplicantId(applicant)}
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-semibold text-[#1b1c19] leading-tight">
                                  {applicant.full_name}
                                </p>
                                <p className="text-[11px] text-[#717973] font-mono">
                                  @{applicant.user_id}
                                </p>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#f0eee9] text-[#1b1c19]">
                                  {applicant.role === "FARMER" && "Farmer"}
                                  {applicant.role === "EQUIPMENT_OWNER" && "Owner"}
                                  {applicant.role === "OPERATOR" && "Operator"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-[#414844] text-xs">
                                {panchayatName}
                              </td>
                              <td className="py-3 px-4 text-[#414844] text-xs">
                                {submittedDate}
                              </td>
                              <td className="py-3 px-4">
                                {applicant.account_status === "APPROVED" && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#c1ecd4] text-[#274e3d] text-xs font-semibold uppercase tracking-wider">
                                    Approved
                                  </span>
                                )}
                                {applicant.account_status === "PENDING_APPROVAL" && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#ffcd6d]/40 text-[#785600] text-xs font-semibold uppercase tracking-wider">
                                    Pending
                                  </span>
                                )}
                                {applicant.account_status === "REJECTED" && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-semibold uppercase tracking-wider">
                                    Rejected
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedApplicant(applicant)}
                                  className="text-[#012d1d] hover:text-[#1b4332] hover:bg-[#eae8e3] p-1.5 rounded-full transition-colors inline-flex items-center justify-center"
                                  title="View Applicant Dossier"
                                >
                                  <span className="material-symbols-outlined text-[20px]">
                                    visibility
                                  </span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-4 py-3 flex items-center justify-between border-t border-[#c1c8c2] bg-white">
                  <span className="text-xs text-[#414844]">
                    Showing{" "}
                    <strong>
                      {filteredApplicants.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}
                    </strong>{" "}
                    to{" "}
                    <strong>
                      {Math.min(currentPage * PAGE_SIZE, filteredApplicants.length)}
                    </strong>{" "}
                    of <strong>{filteredApplicants.length}</strong> entries
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="p-1.5 rounded-md border border-[#c1c8c2] text-[#717973] hover:text-[#1b1c19] hover:bg-[#f5f3ee] transition-colors disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="p-1.5 rounded-md border border-[#c1c8c2] text-[#717973] hover:text-[#1b1c19] hover:bg-[#f5f3ee] transition-colors disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: DASHBOARD OVERVIEW ── */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#c1c8c2] rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#717973] uppercase tracking-wider">
                      Total In Jurisdiction
                    </p>
                    <span className="material-symbols-outlined text-[#1b4332] text-2xl">
                      groups
                    </span>
                  </div>
                  <p className="font-serif text-3xl font-bold text-[#012d1d] mt-2">{totalCount}</p>
                  <p className="text-xs text-[#414844] mt-1">Across all registered panchayats</p>
                </div>

                <div className="bg-white border border-[#c1c8c2] rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#785600] uppercase tracking-wider">
                      Pending Approvals
                    </p>
                    <span className="material-symbols-outlined text-[#785600] text-2xl">
                      hourglass_top
                    </span>
                  </div>
                  <p className="font-serif text-3xl font-bold text-[#785600] mt-2">
                    {pendingCount}
                  </p>
                  <p className="text-xs text-[#785600]/80 mt-1">Awaiting field KYC check</p>
                </div>

                <div className="bg-white border border-[#c1c8c2] rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#274e3d] uppercase tracking-wider">
                      Approved Profiles
                    </p>
                    <span className="material-symbols-outlined text-[#274e3d] text-2xl">
                      verified
                    </span>
                  </div>
                  <p className="font-serif text-3xl font-bold text-[#274e3d] mt-2">
                    {approvedCount}
                  </p>
                  <p className="text-xs text-[#274e3d]/80 mt-1">Active on marketplace</p>
                </div>

                <div className="bg-white border border-[#c1c8c2] rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#93000a] uppercase tracking-wider">
                      Rejected
                    </p>
                    <span className="material-symbols-outlined text-[#93000a] text-2xl">
                      cancel
                    </span>
                  </div>
                  <p className="font-serif text-3xl font-bold text-[#93000a] mt-2">
                    {rejectedCount}
                  </p>
                  <p className="text-xs text-[#93000a]/80 mt-1">Disqualified applications</p>
                </div>
              </div>

              {/* Stakeholder Category Breakdown */}
              <div className="bg-white border border-[#c1c8c2] rounded-xl p-6 shadow-xs">
                <h3 className="font-serif text-lg font-bold text-[#012d1d] mb-4">
                  Stakeholder Category Distribution
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-[#f5f3ee] p-4 border border-[#c1c8c2]/50">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-[#1b4332]" />
                      <h4 className="font-semibold text-sm text-[#012d1d]">Farmers (Kisan)</h4>
                    </div>
                    <p className="text-2xl font-bold text-[#012d1d] mt-2">{farmerCount}</p>
                    <p className="text-xs text-[#414844]">Searching & hiring machinery</p>
                  </div>

                  <div className="rounded-xl bg-[#f5f3ee] p-4 border border-[#c1c8c2]/50">
                    <div className="flex items-center gap-2">
                      <Tractor className="w-5 h-5 text-[#1b4332]" />
                      <h4 className="font-semibold text-sm text-[#012d1d]">
                        Equipment Owners (Yantra Malik)
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-[#012d1d] mt-2">{ownerCount}</p>
                    <p className="text-xs text-[#414844]">Tractors & implements fleet</p>
                  </div>

                  <div className="rounded-xl bg-[#f5f3ee] p-4 border border-[#c1c8c2]/50">
                    <div className="flex items-center gap-2">
                      <IdCard className="w-5 h-5 text-[#1b4332]" />
                      <h4 className="font-semibold text-sm text-[#012d1d]">
                        Operators / Drivers (Chalak)
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-[#012d1d] mt-2">{operatorCount}</p>
                    <p className="text-xs text-[#414844]">Certified agricultural drivers</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: VILLAGE NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <div className="bg-white border border-[#c1c8c2] rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#012d1d]">
                Recent Panchayat Activity Feed
              </h3>
              <div className="divide-y divide-[#c1c8c2]/40">
                {allApplicants.slice(0, 10).map((a) => (
                  <div key={a.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#c1ecd4] text-[#1b4332] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1b1c19]">
                          {a.full_name} submitted registration for {a.role.replace("_", " ")}
                        </p>
                        <p className="text-xs text-[#717973] mt-0.5">
                          Panchayat ID: {a.panchayat_id ?? "N/A"} · User ID: @{a.user_id}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[#717973] shrink-0">
                      {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 4: REPORTS ── */}
          {activeTab === "reports" && (
            <div className="bg-white border border-[#c1c8c2] rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#012d1d]">
                Panchayat Level Verification Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#c1c8c2] bg-[#f5f3ee]">
                      <th className="py-2.5 px-3 font-semibold text-[#414844]">PANCHAYAT NAME</th>
                      <th className="py-2.5 px-3 font-semibold text-[#414844]">TOTAL APPLICANTS</th>
                      <th className="py-2.5 px-3 font-semibold text-[#414844]">APPROVED</th>
                      <th className="py-2.5 px-3 font-semibold text-[#414844]">PENDING</th>
                      <th className="py-2.5 px-3 font-semibold text-[#414844]">REJECTED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c1c8c2]/40">
                    {(panchayatsQuery.data ?? []).map((p) => {
                      const pApplicants = allApplicants.filter((a) => a.panchayat_id === p.id);
                      const pApproved = pApplicants.filter(
                        (a) => a.account_status === "APPROVED"
                      ).length;
                      const pPending = pApplicants.filter(
                        (a) => a.account_status === "PENDING_APPROVAL"
                      ).length;
                      const pRejected = pApplicants.filter(
                        (a) => a.account_status === "REJECTED"
                      ).length;

                      return (
                        <tr key={p.id} className="hover:bg-[#f5f3ee]">
                          <td className="py-2.5 px-3 font-medium text-[#1b1c19]">{p.name}</td>
                          <td className="py-2.5 px-3 font-bold text-[#012d1d]">
                            {pApplicants.length}
                          </td>
                          <td className="py-2.5 px-3 text-[#274e3d] font-semibold">{pApproved}</td>
                          <td className="py-2.5 px-3 text-[#785600] font-semibold">{pPending}</td>
                          <td className="py-2.5 px-3 text-[#93000a] font-semibold">{pRejected}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── APPLICANT DOSSIER & VERIFICATION DECISION DIALOG ── */}
      <Dialog open={!!selectedApplicant} onOpenChange={(open) => !open && setSelectedApplicant(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-0">
          {selectedApplicant && (
            <div>
              {/* Header */}
              <div className="bg-[#1b4332] text-white p-6 rounded-t-2xl relative">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-block bg-white/20 text-white text-[10px] font-mono px-2 py-0.5 rounded-sm uppercase tracking-wider mb-1">
                      {formatApplicantId(selectedApplicant)}
                    </span>
                    <h3 className="font-serif text-xl font-bold">
                      {selectedApplicant.full_name}
                    </h3>
                    <p className="text-xs text-[#c1ecd4]">@{selectedApplicant.user_id}</p>
                  </div>
                  <Badge className="bg-white/20 text-white border-0 text-xs">
                    {selectedApplicant.role.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 text-sm">
                {/* Personal & Identification */}
                <div className="grid grid-cols-2 gap-4 bg-[#f5f3ee] p-4 rounded-xl">
                  <div>
                    <p className="text-xs text-[#717973]">Father's / Husband's Name</p>
                    <p className="font-medium text-[#1b1c19]">
                      {selectedApplicant.father_name || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#717973]">Mobile Number</p>
                    <p className="font-medium text-[#1b1c19] flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#1b4332]" />
                      {selectedApplicant.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#717973]">Aadhaar Last-4 Digits</p>
                    <p className="font-mono font-medium text-[#1b1c19]">
                      {selectedApplicant.aadhaar_last4
                        ? `XXXX-XXXX-${selectedApplicant.aadhaar_last4}`
                        : "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#717973]">Panchayat / Location</p>
                    <p className="font-medium text-[#1b1c19]">
                      {panchayatMap.get(selectedApplicant.panchayat_id ?? -1) ||
                        `Panchayat ID ${selectedApplicant.panchayat_id}`}
                    </p>
                  </div>
                </div>

                {/* Role Specific Details (Equipment / Land) */}
                {applicantDetailQuery.isLoading ? (
                  <div className="p-4 text-center text-xs text-[#717973]">
                    <span className="w-4 h-4 border-2 border-[#1b4332]/30 border-t-[#1b4332] rounded-full animate-spin inline-block mr-1" />
                    Fetching machinery & land records...
                  </div>
                ) : (
                  <>
                    {/* Equipment Owner Specs */}
                    {selectedApplicant.role === "EQUIPMENT_OWNER" && (
                      <div className="border border-[#c1c8c2] rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Tractor className="w-4 h-4 text-[#1b4332]" />
                          <h4 className="font-semibold text-sm text-[#012d1d]">
                            Registered Machinery Fleet
                          </h4>
                        </div>
                        {applicantDetailQuery.data?.equipment ? (
                          <div className="grid grid-cols-2 gap-3 text-xs bg-[#fbf9f4] p-3 rounded-lg">
                            <div>
                              <p className="text-[#717973]">Category</p>
                              <p className="font-semibold">
                                {applicantDetailQuery.data.equipment.category}
                              </p>
                            </div>
                            <div>
                              <p className="text-[#717973]">Make / Model</p>
                              <p className="font-semibold">
                                {applicantDetailQuery.data.equipment.make_model || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[#717973]">Rental Rate (₹/hr)</p>
                              <p className="font-semibold text-[#1b4332]">
                                ₹{applicantDetailQuery.data.equipment.hourly_rate || "—"}/hr
                              </p>
                            </div>
                            <div>
                              <p className="text-[#717973]">Rental Rate (₹/acre)</p>
                              <p className="font-semibold text-[#1b4332]">
                                ₹{applicantDetailQuery.data.equipment.acre_rate || "—"}/ac
                              </p>
                            </div>
                            <div>
                              <p className="text-[#717973]">RC Number</p>
                              <p className="font-mono">
                                {applicantDetailQuery.data.equipment.reg_number || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-[#717973]">Insurance</p>
                              <p className="font-semibold">
                                {applicantDetailQuery.data.equipment.has_insurance
                                  ? "✅ Active"
                                  : "❌ None"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-[#717973]">
                            Equipment details not yet completed by applicant.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Farmer Land Plots */}
                    {selectedApplicant.role === "FARMER" && (
                      <div className="border border-[#c1c8c2] rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#1b4332]" />
                          <h4 className="font-semibold text-sm text-[#012d1d]">
                            Farmland Plots ({applicantDetailQuery.data?.landPlots.length || 0})
                          </h4>
                        </div>
                        {(applicantDetailQuery.data?.landPlots ?? []).length > 0 ? (
                          <div className="space-y-2">
                            {applicantDetailQuery.data!.landPlots.map((plot) => (
                              <div
                                key={plot.id}
                                className="flex justify-between items-center text-xs bg-[#fbf9f4] p-2.5 rounded-lg"
                              >
                                <span className="font-medium text-[#1b1c19]">
                                  {plot.plot_name} ({plot.soil_type})
                                </span>
                                <span className="font-bold text-[#1b4332]">
                                  {plot.bigha} Bigha {plot.katha} Katha
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#717973]">No land plots mapped yet.</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Rejection reason box if rejecting */}
                {rejectingId === selectedApplicant.id && (
                  <div className="space-y-2 bg-[#ffdad6]/30 border border-[#ba1a1a]/30 p-3 rounded-xl">
                    <Label htmlFor="reject-reason" className="text-xs font-semibold text-[#ba1a1a]">
                      Reason for Rejection (Required)
                    </Label>
                    <Input
                      id="reject-reason"
                      placeholder="e.g. Incomplete land verification / incorrect RC number"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="h-9 text-xs border-[#ba1a1a]/40 bg-white"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3 border-t border-[#c1c8c2]">
                  {selectedApplicant.account_status === "PENDING_APPROVAL" ? (
                    <>
                      {rejectingId === selectedApplicant.id ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRejectingId(null)}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={decideMutation.isPending || rejectionReason.trim().length < 3}
                            onClick={() =>
                              decideMutation.mutate({
                                id: selectedApplicant.id,
                                approve: false,
                                reason: rejectionReason.trim(),
                              })
                            }
                            className="flex-1"
                          >
                            Confirm Rejection
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRejectingId(selectedApplicant.id)}
                            className="flex-1 border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/40"
                          >
                            Reject Application
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={decideMutation.isPending}
                            onClick={() =>
                              decideMutation.mutate({
                                id: selectedApplicant.id,
                                approve: true,
                              })
                            }
                            className="flex-1 bg-[#1b4332] text-white hover:bg-[#012d1d]"
                          >
                            Approve Application
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full text-center">
                      <p className="text-xs text-[#717973]">
                        This application has already been marked as{" "}
                        <strong className="text-[#1b1c19]">
                          {selectedApplicant.account_status}
                        </strong>
                        .
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
