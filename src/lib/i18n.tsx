import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const STORAGE_KEY = "jamui.lang";

/** Every user-visible string in the app, English + Hindi. */
const DICT = {
  appName: { en: "Krishi Sanjha", hi: "कृषि सांझा" },
  appSub: { en: "Share Machines. Grow Together.", hi: "यंत्र साझा करें, साथ बढ़ें।" },
  tagline: {
    en: "Farm machinery sharing for Bihar — starting with Jamui district",
    hi: "बिहार के लिए कृषि यंत्र साझा मंच — जमुई जिले से शुरुआत",
  },
  heroBadge: { en: "DEMO MVP · Rural equipment sharing", hi: "डेमो एमवीपी · ग्रामीण यंत्र साझेदारी" },
  heroTitle: {
    en: "Access the Right Farm Equipment, Right When You Need It.",
    hi: "सही कृषि यंत्र, ठीक उसी समय जब आपको ज़रूरत हो।",
  },
  heroBody: {
    en: "Connect with nearby farmers, equipment owners and agricultural service providers across Bihar.",
    hi: "बिहार भर के नज़दीकी किसानों, यंत्र मालिकों और सेवा प्रदाताओं से जुड़ें।",
  },
  findEquipment: { en: "Find Equipment", hi: "यंत्र खोजें" },
  listEquipment: { en: "List Your Equipment", hi: "अपना यंत्र दर्ज करें" },
  problemTitle: {
    en: "One Farmer Has the Machine. Another Farmer Needs It.",
    hi: "एक किसान के पास मशीन है, दूसरे को उसकी ज़रूरत है।",
  },
  p1t: { en: "Expensive equipment", hi: "महँगे यंत्र" },
  p1b: { en: "Small farmers cannot afford ownership.", hi: "छोटे किसान खरीद नहीं सकते।" },
  p2t: { en: "Idle machines", hi: "बेकार खड़ी मशीनें" },
  p2b: { en: "Equipment stays unused for many hours.", hi: "यंत्र घंटों बिना उपयोग खड़े रहते हैं।" },
  p3t: { en: "Hard to find", hi: "खोजना मुश्किल" },
  p3b: { en: "Farmers struggle to locate machines nearby.", hi: "पास की मशीन ढूँढ़ना कठिन है।" },
  p4t: { en: "Peak shortages", hi: "सीज़न में कमी" },
  p4b: { en: "Demand rises sharply during seasons.", hi: "मौसम में माँग तेज़ी से बढ़ती है।" },
  howTitle: { en: "How It Works", hi: "यह कैसे काम करता है" },
  s1t: { en: "Search", hi: "खोजें" },
  s1b: { en: "Find nearby machines.", hi: "नज़दीकी मशीनें देखें।" },
  s2t: { en: "Compare", hi: "तुलना करें" },
  s2b: { en: "Check price, rating and availability.", hi: "कीमत, रेटिंग और उपलब्धता देखें।" },
  s3t: { en: "Book", hi: "बुक करें" },
  s3b: { en: "Choose service and confirm.", hi: "सेवा चुनें और पुष्टि करें।" },
  s4t: { en: "Get Work Done", hi: "काम पूरा कराएँ" },
  s4b: { en: "Track the booking to completion.", hi: "बुकिंग को पूरा होने तक देखें।" },
  ownersLabel: { en: "FOR OWNERS", hi: "यंत्र मालिकों के लिए" },
  ownersTitle: { en: "Your Machine Can Earn More.", hi: "आपकी मशीन और कमा सकती है।" },
  ownersBody: {
    en: "Turn unused hours into extra income while helping nearby farmers.",
    hi: "खाली घंटों को आमदनी में बदलें और पड़ोसी किसानों की मदद करें।",
  },
  saathiTitle: { en: "Not comfortable using an app?", hi: "ऐप चलाने में असहज हैं?" },
  saathiBody: {
    en: "Technology behind the scenes. Human support in front.",
    hi: "पीछे तकनीक, सामने इंसानी मदद।",
  },
  saathiCta: { en: "Book with Village Saathi", hi: "ग्राम साथी से बुक करें" },

  login: { en: "Sign in", hi: "लॉगिन करें" },
  logout: { en: "Sign out", hi: "लॉग आउट" },
  register: { en: "Create account", hi: "नया पंजीकरण" },
  userId: { en: "User ID", hi: "यूज़र आईडी" },
  password: { en: "Password", hi: "पासवर्ड" },
  confirmPassword: { en: "Confirm password", hi: "पासवर्ड दोबारा" },
  remember: { en: "Keep me signed in", hi: "साइन इन रखें" },
  fullName: { en: "Full name", hi: "पूरा नाम" },
  role: { en: "I am a", hi: "मैं हूँ" },
  block: { en: "Block", hi: "प्रखंड" },
  panchayat: { en: "Panchayat", hi: "पंचायत" },
  village: { en: "Village", hi: "गाँव" },
  selectOption: { en: "Select", hi: "चुनें" },
  location: { en: "Pin your location", hi: "अपना स्थान चिन्हित करें" },
  useGps: { en: "Use my GPS", hi: "मेरा जीपीएस लें" },
  submit: { en: "Submit application", hi: "आवेदन भेजें" },
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  verification: { en: "Verification console", hi: "सत्यापन पटल" },
  pendingTitle: { en: "Your application is under review", hi: "आपका आवेदन समीक्षाधीन है" },
  pendingBody: {
    en: "A local verifying officer will approve your account shortly. You can sign in any time to check the status.",
    hi: "स्थानीय सत्यापन अधिकारी शीघ्र ही आपका खाता स्वीकृत करेंगे। स्थिति देखने के लिए आप कभी भी लॉगिन कर सकते हैं।",
  },
  rejectedTitle: { en: "Application rejected", hi: "आवेदन अस्वीकृत" },
  reason: { en: "Reason", hi: "कारण" },
  approve: { en: "Approve", hi: "स्वीकृत करें" },
  reject: { en: "Reject", hi: "अस्वीकार करें" },
  rejectReason: { en: "Reason for rejection", hi: "अस्वीकृति का कारण" },
  queueEmpty: { en: "No pending applications right now.", hi: "अभी कोई लंबित आवेदन नहीं है।" },
  auditTitle: { en: "District audit trail", hi: "जिला अंकेक्षण सूची" },
  status: { en: "Status", hi: "स्थिति" },
  submittedOn: { en: "Submitted", hi: "जमा किया" },
  noAccount: { en: "New user? Register", hi: "नए हैं? पंजीकरण करें" },
  haveAccount: { en: "Already registered? Sign in", hi: "पहले से पंजीकृत? लॉगिन करें" },
  loading: { en: "Loading…", hi: "लोड हो रहा है…" },
  welcome: { en: "Welcome", hi: "स्वागत है" },
  offlineNote: {
    en: "Demo mode — data is stored on this device.",
    hi: "डेमो मोड — डेटा इसी उपकरण पर सुरक्षित है।",
  },
  FARMER: { en: "Farmer", hi: "किसान" },
  EQUIPMENT_OWNER: { en: "Equipment owner", hi: "यंत्र मालिक" },
  OPERATOR: { en: "Operator / driver", hi: "चालक" },
  VILLAGE_ADMIN: { en: "Village admin", hi: "ग्राम प्रशासक" },
  BLOCK_ADMIN: { en: "Block admin", hi: "प्रखंड प्रशासक" },
  DISTRICT_ADMIN: { en: "District admin", hi: "जिला प्रशासक" },
  PENDING_APPROVAL: { en: "Pending approval", hi: "स्वीकृति लंबित" },
  APPROVED: { en: "Approved", hi: "स्वीकृत" },
  REJECTED: { en: "Rejected", hi: "अस्वीकृत" },
} as const;

export type TKey = keyof typeof DICT;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
}

const I18nContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => DICT[k].en });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === "hi" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  };

  const t = (key: TKey) => DICT[key][lang];

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
