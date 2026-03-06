import type { OnyxProfile } from "@/lib/onyx-utils";
import { ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  profile: OnyxProfile;
}

type Category =
  | "All"
  | "Tech"
  | "World"
  | "Sports"
  | "Business"
  | "Entertainment";

interface NewsArticle {
  id: string;
  category: Exclude<Category, "All">;
  headline: string;
  source: string;
  hoursAgo: number;
  excerpt: string;
  url: string;
}

const CATEGORY_COLORS: Record<Exclude<Category, "All">, string> = {
  Tech: "oklch(0.55 0.18 240)",
  World: "oklch(0.52 0.16 155)",
  Sports: "oklch(0.62 0.2 55)",
  Business: "oklch(0.55 0.14 185)",
  Entertainment: "oklch(0.52 0.18 310)",
};

const CATEGORY_BG: Record<Exclude<Category, "All">, string> = {
  Tech: "oklch(0.55 0.18 240 / 0.12)",
  World: "oklch(0.52 0.16 155 / 0.12)",
  Sports: "oklch(0.62 0.2 55 / 0.12)",
  Business: "oklch(0.55 0.14 185 / 0.12)",
  Entertainment: "oklch(0.52 0.18 310 / 0.12)",
};

const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: "1",
    category: "Tech",
    headline: "OpenAI Unveils Next-Generation Model With Real-Time Reasoning",
    source: "The Verge",
    hoursAgo: 1,
    excerpt:
      "The new model demonstrates unprecedented capabilities in logical deduction and real-time problem solving, outperforming previous benchmarks across mathematics, coding, and scientific reasoning tasks.",
    url: "https://theverge.com",
  },
  {
    id: "2",
    category: "World",
    headline:
      "Global Climate Summit Reaches Historic Carbon Reduction Agreement",
    source: "Reuters",
    hoursAgo: 2,
    excerpt:
      "World leaders from 145 nations signed a landmark agreement to reduce carbon emissions by 65% before 2040, marking the most ambitious climate deal in history following three weeks of tense negotiations.",
    url: "https://reuters.com",
  },
  {
    id: "3",
    category: "Business",
    headline: "Apple Becomes First Company to Reach $4 Trillion Valuation",
    source: "Bloomberg",
    hoursAgo: 3,
    excerpt:
      "Apple Inc. crossed the historic $4 trillion market cap milestone on Thursday, driven by robust iPhone 16 sales, expanding services revenue, and growing investor confidence in its AI integration roadmap.",
    url: "https://bloomberg.com",
  },
  {
    id: "4",
    category: "Sports",
    headline:
      "Champions League Final Sets New Global Viewership Record of 1.2B",
    source: "ESPN",
    hoursAgo: 4,
    excerpt:
      "The UEFA Champions League final between Real Madrid and Manchester City shattered viewership records, with an estimated 1.2 billion viewers tuning in across broadcasts, streams, and public screenings worldwide.",
    url: "https://espn.com",
  },
  {
    id: "5",
    category: "Entertainment",
    headline:
      'Sci-Fi Epic "Horizon Protocol" Breaks Opening Weekend Box Office',
    source: "Variety",
    hoursAgo: 5,
    excerpt:
      "The long-awaited sci-fi thriller dominated global box offices with a $380 million opening weekend, positioning it as the highest-grossing film debut of the decade and sparking immediate sequel discussions.",
    url: "https://variety.com",
  },
  {
    id: "6",
    category: "Tech",
    headline:
      "SpaceX Starship Completes First Commercial Cargo Mission to Moon",
    source: "Ars Technica",
    hoursAgo: 6,
    excerpt:
      "Starship's fifth commercial mission successfully delivered 47 tonnes of payload to lunar orbit, marking a pivotal milestone in humanity's return to the Moon and validating the spacecraft's heavy-lift capabilities.",
    url: "https://arstechnica.com",
  },
  {
    id: "7",
    category: "World",
    headline: "WHO Declares End to Three-Year Global Health Emergency",
    source: "AP News",
    hoursAgo: 8,
    excerpt:
      "The World Health Organization officially declared an end to the international public health emergency that began in 2022, citing falling case numbers, improved healthcare infrastructure, and successful vaccination campaigns.",
    url: "https://apnews.com",
  },
  {
    id: "8",
    category: "Business",
    headline: "Federal Reserve Signals Three Rate Cuts Expected This Year",
    source: "Wall Street Journal",
    hoursAgo: 9,
    excerpt:
      "Federal Reserve Chair Jerome Powell signaled that three quarter-point rate cuts are likely before year-end, citing falling inflation metrics and a desire to stimulate cautious economic growth without overheating markets.",
    url: "https://wsj.com",
  },
  {
    id: "9",
    category: "Entertainment",
    headline:
      "Grammy-Winning Artist Drops Surprise Album, Breaks Streaming Records",
    source: "Rolling Stone",
    hoursAgo: 10,
    excerpt:
      "The surprise 18-track release accumulated 420 million streams in its first 24 hours, obliterating previous records and sending three songs simultaneously to the top of global charts across all major platforms.",
    url: "https://rollingstone.com",
  },
  {
    id: "10",
    category: "Sports",
    headline: "23-Year-Old Becomes Youngest Wimbledon Champion in 40 Years",
    source: "BBC Sport",
    hoursAgo: 12,
    excerpt:
      "In a stunning five-set final that lasted nearly four hours, the unseeded qualifier became Wimbledon's youngest champion since 1985, defeating the world's top-ranked player with a masterclass in serve-and-volley tennis.",
    url: "https://bbc.co.uk/sport",
  },
  {
    id: "11",
    category: "Tech",
    headline:
      "Google Quantum Chip Achieves Milestone in Drug Discovery Simulation",
    source: "Nature",
    hoursAgo: 14,
    excerpt:
      "Google's Willow quantum processor successfully simulated complex protein folding mechanisms that would take classical supercomputers 10,000 years, opening transformative possibilities for pharmaceutical research.",
    url: "https://nature.com",
  },
  {
    id: "12",
    category: "World",
    headline:
      "Arctic Sea Ice Reaches Largest Extent in 15 Years, Scientists Say",
    source: "National Geographic",
    hoursAgo: 18,
    excerpt:
      "Researchers report an unexpected 12% increase in Arctic sea ice coverage compared to the five-year average, attributing the anomaly to shifts in polar wind patterns and cooler Atlantic Ocean surface temperatures.",
    url: "https://nationalgeographic.com",
  },
];

const CATEGORIES: Category[] = [
  "All",
  "Tech",
  "World",
  "Sports",
  "Business",
  "Entertainment",
];

function formatTime(hoursAgo: number): string {
  if (hoursAgo < 1) return "Just now";
  if (hoursAgo === 1) return "1h ago";
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  const days = Math.floor(hoursAgo / 24);
  return days === 1 ? "1d ago" : `${days}d ago`;
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5 animate-pulse"
      style={{
        background: "oklch(0.11 0.008 260)",
        border: "1px solid oklch(0.18 0.01 260)",
      }}
    >
      <div
        className="h-4 w-20 rounded-full mb-3"
        style={{ background: "oklch(0.18 0.01 260)" }}
      />
      <div
        className="h-5 rounded mb-2"
        style={{ background: "oklch(0.18 0.01 260)" }}
      />
      <div
        className="h-5 w-3/4 rounded mb-4"
        style={{ background: "oklch(0.18 0.01 260)" }}
      />
      <div
        className="h-4 rounded mb-1.5"
        style={{ background: "oklch(0.15 0.008 260)" }}
      />
      <div
        className="h-4 rounded mb-1.5"
        style={{ background: "oklch(0.15 0.008 260)" }}
      />
      <div
        className="h-4 w-2/3 rounded mb-4"
        style={{ background: "oklch(0.15 0.008 260)" }}
      />
      <div
        className="h-4 w-24 rounded"
        style={{ background: "oklch(0.16 0.008 260)" }}
      />
    </div>
  );
}

interface NewsCardProps {
  article: NewsArticle;
  index: number;
}

function NewsCard({ article, index }: NewsCardProps) {
  const [hovered, setHovered] = useState(false);
  const catColor = CATEGORY_COLORS[article.category];
  const catBg = CATEGORY_BG[article.category];

  return (
    <motion.article
      data-ocid={`news.item.${index + 1}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      className="rounded-2xl p-5 cursor-pointer relative overflow-hidden group"
      style={{
        background: hovered ? "oklch(0.14 0.01 260)" : "oklch(0.11 0.008 260)",
        border: `1px solid ${hovered ? "oklch(0.25 0.01 260)" : "oklch(0.18 0.01 260)"}`,
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        transition:
          "background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s",
        boxShadow: hovered
          ? "0 8px 32px oklch(0 0 0 / 0.4), 0 2px 8px oklch(0 0 0 / 0.3)"
          : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => window.open(article.url, "_blank", "noopener,noreferrer")}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          window.open(article.url, "_blank", "noopener,noreferrer");
        }
      }}
    >
      {/* Subtle accent line on hover */}
      <div
        className="absolute inset-x-0 top-0 h-px transition-opacity duration-200"
        style={{
          background: `linear-gradient(90deg, transparent, ${catColor}, transparent)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Category badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
          style={{
            color: catColor,
            background: catBg,
          }}
        >
          {article.category}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[11px]"
            style={{ color: "oklch(0.4 0.012 260)" }}
          >
            {article.source}
          </span>
          <span
            className="text-[11px]"
            style={{ color: "oklch(0.32 0.01 260)" }}
          >
            ·
          </span>
          <span
            className="text-[11px]"
            style={{ color: "oklch(0.4 0.012 260)" }}
          >
            {formatTime(article.hoursAgo)}
          </span>
        </div>
      </div>

      {/* Headline */}
      <h3
        className="font-bold text-sm leading-snug mb-3 line-clamp-2 transition-colors duration-200"
        style={{
          color: hovered ? "oklch(0.72 0.15 55)" : "oklch(0.9 0.01 260)",
          fontFamily: "'Sora', sans-serif",
        }}
      >
        {article.headline}
      </h3>

      {/* Excerpt */}
      <p
        className="text-xs leading-relaxed line-clamp-3 mb-4"
        style={{ color: "oklch(0.5 0.015 260)" }}
      >
        {article.excerpt}
      </p>

      {/* Read more */}
      <div className="flex items-center gap-1.5">
        <span
          className="text-xs font-semibold tracking-wide transition-colors duration-200"
          style={{
            color: hovered ? "oklch(0.72 0.15 55)" : "oklch(0.45 0.012 260)",
          }}
        >
          Read more
        </span>
        <ExternalLink
          size={11}
          style={{
            color: hovered ? "oklch(0.72 0.15 55)" : "oklch(0.45 0.012 260)",
            transition: "color 0.2s",
          }}
        />
      </div>
    </motion.article>
  );
}

export default function DailyNewsPage({ profile: _profile }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerLoad = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setLoading(true);
    setArticles([]);
    refreshTimerRef.current = setTimeout(() => {
      setArticles(MOCK_ARTICLES);
      setLoading(false);
    }, 320);
  }, []);

  useEffect(() => {
    triggerLoad();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [triggerLoad]);

  const handleRefresh = () => {
    if (isRefreshing || loading) return;
    setIsRefreshing(true);
    triggerLoad();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filtered =
    activeCategory === "All"
      ? articles
      : articles.filter((a) => a.category === activeCategory);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: "oklch(0.08 0.005 260)" }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 px-4 pt-5 pb-3"
        style={{ borderBottom: "1px solid oklch(0.15 0.008 260)" }}
      >
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{ background: "oklch(0.72 0.15 55 / 0.1)" }}
            >
              <Newspaper size={18} style={{ color: "oklch(0.72 0.15 55)" }} />
            </div>
            <div>
              <h1
                className="text-lg font-bold tracking-wide gold-shimmer"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                DAILY NEWS
              </h1>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: "oklch(0.4 0.012 260)" }}
              >
                {today}
              </p>
            </div>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            data-ocid="news.button"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="p-2 rounded-xl transition-all"
            style={{
              background: "oklch(0.13 0.01 260)",
              border: "1px solid oklch(0.2 0.01 260)",
              color:
                loading || isRefreshing
                  ? "oklch(0.3 0.01 260)"
                  : "oklch(0.55 0.015 260)",
              cursor: loading || isRefreshing ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!loading && !isRefreshing) {
                e.currentTarget.style.color = "oklch(0.72 0.15 55)";
                e.currentTarget.style.borderColor = "oklch(0.72 0.15 55 / 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color =
                loading || isRefreshing
                  ? "oklch(0.3 0.01 260)"
                  : "oklch(0.55 0.015 260)";
              e.currentTarget.style.borderColor = "oklch(0.2 0.01 260)";
            }}
            title="Refresh news"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </button>
        </div>

        {/* Category filter */}
        <div
          className="flex items-center gap-2 mt-3 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
          data-ocid="news.tab"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const catColor =
              cat === "All" ? "oklch(0.72 0.15 55)" : CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                type="button"
                data-ocid={`news.${cat.toLowerCase()}.tab`}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide transition-all"
                style={{
                  background: isActive
                    ? cat === "All"
                      ? "oklch(0.72 0.15 55 / 0.15)"
                      : `${catColor.replace(")", " / 0.15)").replace("oklch(", "oklch(")}`
                    : "oklch(0.13 0.008 260)",
                  border: `1px solid ${isActive ? catColor : "oklch(0.2 0.01 260)"}`,
                  color: isActive ? catColor : "oklch(0.4 0.012 260)",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              data-ocid="news.loading_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders are positional
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              data-ocid="news.empty_state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <div
                className="p-5 rounded-2xl"
                style={{ background: "oklch(0.12 0.008 260)" }}
              >
                <Newspaper
                  size={32}
                  style={{ color: "oklch(0.35 0.01 260)" }}
                />
              </div>
              <p className="text-sm" style={{ color: "oklch(0.45 0.015 260)" }}>
                No articles in this category
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={`articles-${activeCategory}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4"
            >
              {filtered.map((article, i) => (
                <NewsCard key={article.id} article={article} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer count */}
      {!loading && (
        <div
          className="flex-shrink-0 px-4 py-2 flex items-center justify-between"
          style={{ borderTop: "1px solid oklch(0.13 0.008 260)" }}
        >
          <span
            className="text-[11px]"
            style={{ color: "oklch(0.35 0.01 260)" }}
          >
            {filtered.length} article{filtered.length !== 1 ? "s" : ""}
            {activeCategory !== "All" ? ` in ${activeCategory}` : " today"}
          </span>
          <span
            className="text-[11px]"
            style={{ color: "oklch(0.3 0.01 260)" }}
          >
            © {new Date().getFullYear()} ·{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "oklch(0.4 0.012 260)" }}
            >
              caffeine.ai
            </a>
          </span>
        </div>
      )}
    </div>
  );
}
