import type { Block, Panchayat, Village } from "./types";

/**
 * The 10 administrative blocks of Jamui district, Bihar.
 * Panchayat / village rows below are DEMO placeholders used only by the
 * offline mock API. When VITE_API_BASE_URL is configured, the real
 * /api/v1/locations/* endpoints (fed by the official seed file) are used.
 */
export const JAMUI_BLOCKS: Block[] = [
  { id: 1, name: "Jamui", name_hi: "जमुई" },
  { id: 2, name: "Jhajha", name_hi: "झाझा" },
  { id: 3, name: "Chakai", name_hi: "चकाई" },
  { id: 4, name: "Sono", name_hi: "सोनो" },
  { id: 5, name: "Sikandra", name_hi: "सिकंदरा" },
  { id: 6, name: "Khaira", name_hi: "खैरा" },
  { id: 7, name: "Gidhaur", name_hi: "गिद्धौर" },
  { id: 8, name: "Barhat", name_hi: "बरहट" },
  { id: 9, name: "Islamnagar Aliganj", name_hi: "इस्लामनगर अलीगंज" },
  { id: 10, name: "Laxmipur", name_hi: "लक्ष्मीपुर" },
];

const PANCHAYAT_SUFFIX = ["Uttar", "Dakshin", "Purab"];
const VILLAGE_SUFFIX = ["Bazar", "Tola", "Diha"];

export const JAMUI_PANCHAYATS: Panchayat[] = JAMUI_BLOCKS.flatMap((b) =>
  PANCHAYAT_SUFFIX.map((s, i) => ({
    id: b.id * 100 + i + 1,
    block_id: b.id,
    name: `${b.name} ${s}`,
  })),
);

export const JAMUI_VILLAGES: Village[] = JAMUI_PANCHAYATS.flatMap((p) =>
  VILLAGE_SUFFIX.map((s, i) => ({
    id: p.id * 10 + i + 1,
    panchayat_id: p.id,
    name: `${p.name} ${s}`,
    ward: `Ward ${i + 1}`,
    tola: null,
  })),
);

/** Approximate district centre, used as the default map pin. */
export const JAMUI_CENTER: [number, number] = [24.9264, 86.2242];
