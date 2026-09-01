import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Krishi Sanjha - Agri-Tech Marketplace" },
      {
        name: "description",
        content:
          "Empowering farmers through shared access to premium equipment. Build community, reduce costs, and increase yields.",
      },
      { property: "og:title", content: "Krishi Sanjha - Agri-Tech Marketplace" },
      {
        property: "og:description",
        content: "Revolutionizing Indian Agriculture, One Machine at a Time.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Home,
});

const HERO_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAvHSu569E6C1P_p9VWqERBND4ybV-M7t9oA9dp1JkeSikgUIhaNSXVXd2cYTWPi21ul8G68yDYc5OX7hQRgkonJK2cwBxW06RCpfRBazaHk1cRRrQ--dk4ze5DVeHSpkWS-4OAZPPmDMNR-DpgeUrbOqqoVE9IM9OQsf2vTiuGhKf9HwBqmdnzAzj3j8oLps075tm-HbLjsrGE1YyAbG-RCUpQRisGl5MKE757FHtFUZ0FvhfQj9Mh";

function Home() {
  const { t } = useI18n();

  return (
    <AppShell>
      {/* Hero Section */}
      <section className="relative -mt-20 h-[85vh] min-h-[540px] flex items-center justify-center px-4 md:px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className="bg-cover bg-center w-full h-full transform scale-105 transition-transform duration-1000"
            style={{ backgroundImage: `url('${HERO_IMAGE_URL}')` }}
          />
          {/* Dark luxury overlay */}
          <div className="absolute inset-0 bg-[#082717]/75 backdrop-brightness-90" />
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto flex flex-col items-center gap-6 pt-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffcd6d]/20 text-[#ffdea5] text-xs font-semibold tracking-wide border border-[#ffcd6d]/30">
            🌾 {t("heroBadgeHome")}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            {t("heroTitleHome")}
          </h1>
          <p className="text-base sm:text-lg text-[#ebe8e2] max-w-xl leading-relaxed">
            {t("heroBodyHome")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            <Link
              to="/register"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-[#1f3d2b] to-[#2c4e38] text-white font-medium text-sm sm:text-base shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20"
            >
              {t("exploreMarketplace")}
            </Link>
            <Link
              to="/register"
              className="px-8 py-4 rounded-full bg-white/10 text-white font-medium text-sm sm:text-base hover:bg-white/20 backdrop-blur-md transition-colors border border-white/30"
            >
              {t("listEquipmentBtn")}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#e5e2dc] py-6 px-4 md:px-8 border-b border-[#c2c8c1]/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 divide-y md:divide-y-0 md:divide-x divide-[#c2c8c1]/60">
          <div className="flex items-center gap-4 py-2 md:px-8">
            <span className="material-symbols-outlined text-[#082717] text-4xl">
              groups
            </span>
            <div>
              <p className="font-serif text-2xl font-bold text-[#082717]">500+</p>
              <p className="text-xs uppercase tracking-wider text-[#424843] font-semibold">{t("activeFarmers")}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-2 md:px-8">
            <span className="material-symbols-outlined text-[#082717] text-4xl">
              precision_manufacturing
            </span>
            <div>
              <p className="font-serif text-2xl font-bold text-[#082717]">200+</p>
              <p className="text-xs uppercase tracking-wider text-[#424843] font-semibold">{t("machinesVerified")}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-2 md:px-8">
            <span className="material-symbols-outlined text-[#082717] text-4xl">
              location_on
            </span>
            <div>
              <p className="font-serif text-2xl font-bold text-[#082717]">{t("tenBlocks")}</p>
              <p className="text-xs uppercase tracking-wider text-[#424843] font-semibold">{t("districtCoverage")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#082717] mb-3">
            {t("seamlessTitle")}
          </h2>
          <p className="text-[#424843] max-w-lg mx-auto text-base">
            {t("seamlessBody")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:-translate-y-1.5 transition-all duration-300 border border-[#c2c8c1]/30 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#f0eee8] flex items-center justify-center mb-5 text-[#7b5800]">
              <span className="material-symbols-outlined text-3xl">search</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#082717] mb-2">{t("step1Title")}</h3>
            <p className="text-sm text-[#424843]">
              {t("step1Body")}
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:-translate-y-1.5 transition-all duration-300 border border-[#c2c8c1]/30 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#f0eee8] flex items-center justify-center mb-5 text-[#7b5800]">
              <span className="material-symbols-outlined text-3xl">calendar_month</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#082717] mb-2">{t("step2Title")}</h3>
            <p className="text-sm text-[#424843]">
              {t("step2Body")}
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:-translate-y-1.5 transition-all duration-300 border border-[#c2c8c1]/30 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#f0eee8] flex items-center justify-center mb-5 text-[#7b5800]">
              <span className="material-symbols-outlined text-3xl">handshake</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#082717] mb-2">{t("step3Title")}</h3>
            <p className="text-sm text-[#424843]">
              {t("step3Body")}
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:-translate-y-1.5 transition-all duration-300 border border-[#c2c8c1]/30 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#f0eee8] flex items-center justify-center mb-5 text-[#7b5800]">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#082717] mb-2">{t("step4Title")}</h3>
            <p className="text-sm text-[#424843]">
              {t("step4Body")}
            </p>
          </div>
        </div>
      </section>

      {/* Marketplace Highlights / Categories */}
      <section id="categories" className="bg-[#f6f3ed] py-20 px-4 md:px-8 border-y border-[#c2c8c1]/30 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#082717] mb-2">
                {t("featuredCategories")}
              </h2>
              <p className="text-[#424843] text-base">
                {t("categoriesBody")}
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-2.5 rounded-full border border-[#082717] text-[#082717] text-sm font-medium hover:bg-[#082717]/5 transition-colors"
            >
              {t("viewAllMachinery")}
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Category 1 */}
            <Link to="/register" className="group cursor-pointer">
              <div className="bg-white rounded-2xl p-8 mb-3 shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-200 border border-[#c2c8c1]/20">
                <span className="material-symbols-outlined text-[#082717] text-5xl opacity-85 group-hover:scale-110 transition-transform">
                  agriculture
                </span>
              </div>
              <h4 className="text-base font-semibold text-[#082717] text-center">{t("cat1")}</h4>
            </Link>

            {/* Category 2 */}
            <Link to="/register" className="group cursor-pointer">
              <div className="bg-white rounded-2xl p-8 mb-3 shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-200 border border-[#c2c8c1]/20">
                <span className="material-symbols-outlined text-[#082717] text-5xl opacity-85 group-hover:scale-110 transition-transform">
                  grass
                </span>
              </div>
              <h4 className="text-base font-semibold text-[#082717] text-center">{t("cat2")}</h4>
            </Link>

            {/* Category 3 */}
            <Link to="/register" className="group cursor-pointer">
              <div className="bg-white rounded-2xl p-8 mb-3 shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-200 border border-[#c2c8c1]/20">
                <span className="material-symbols-outlined text-[#082717] text-5xl opacity-85 group-hover:scale-110 transition-transform">
                  water_drop
                </span>
              </div>
              <h4 className="text-base font-semibold text-[#082717] text-center">{t("cat3")}</h4>
            </Link>

            {/* Category 4 */}
            <Link to="/register" className="group cursor-pointer">
              <div className="bg-white rounded-2xl p-8 mb-3 shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-200 border border-[#c2c8c1]/20">
                <span className="material-symbols-outlined text-[#082717] text-5xl opacity-85 group-hover:scale-110 transition-transform">
                  build
                </span>
              </div>
              <h4 className="text-base font-semibold text-[#082717] text-center">{t("cat4")}</h4>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto text-center">
        <div className="bg-[#ffcd6d] rounded-3xl p-10 md:p-20 shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center gap-4">
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#785600] leading-tight">
              {t("ctaTitle")}
            </h2>
            <p className="text-base sm:text-lg text-[#785600]/90 max-w-xl mb-4">
              {t("ctaBody")}
            </p>
            <Link
              to="/register"
              className="px-9 py-4 rounded-full bg-[#082717] text-white font-medium text-base shadow-lg hover:bg-[#1f3d2b] transition-all duration-200 hover:scale-105"
            >
              {t("ctaBtn")}
            </Link>
          </div>
          {/* Subtle ambient blur shapes */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#7b5800]/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-white/40 rounded-full blur-3xl" />
        </div>
      </section>
    </AppShell>
  );
}
