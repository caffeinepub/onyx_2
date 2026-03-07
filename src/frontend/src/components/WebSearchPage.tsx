import { ExternalLink, Loader2, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

interface SearchResult {
  id: string;
  title: string;
  url: string;
  displayUrl: string;
  description: string;
  category: string;
}

// Deterministic seeded random
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const RESULT_TEMPLATES = {
  general: [
    {
      domain: "wikipedia.org",
      titleSuffix: "- Wikipedia",
      descPrefix: "Wikipedia, the free encyclopedia — ",
      path: "/wiki/",
    },
    {
      domain: "reddit.com",
      titleSuffix: "- Reddit",
      descPrefix: "Discussions and community posts about ",
      path: "/r/",
    },
    {
      domain: "quora.com",
      titleSuffix: "| Quora",
      descPrefix: "Answers from experts and community members on ",
      path: "/",
    },
    {
      domain: "medium.com",
      titleSuffix: "| Medium",
      descPrefix: "In-depth articles and analysis on ",
      path: "/@article/",
    },
    {
      domain: "britannica.com",
      titleSuffix: "| Britannica",
      descPrefix: "Encyclopedia Britannica's comprehensive coverage of ",
      path: "/topic/",
    },
  ],
  tech: [
    {
      domain: "stackoverflow.com",
      titleSuffix: "- Stack Overflow",
      descPrefix: "Developer Q&A and solutions for ",
      path: "/questions/",
    },
    {
      domain: "github.com",
      titleSuffix: "- GitHub",
      descPrefix: "Open source repositories and code examples for ",
      path: "/topics/",
    },
    {
      domain: "developer.mozilla.org",
      titleSuffix: "| MDN Web Docs",
      descPrefix: "Official web development documentation for ",
      path: "/docs/",
    },
    {
      domain: "dev.to",
      titleSuffix: "- DEV Community",
      descPrefix: "Developer tutorials and articles about ",
      path: "/tag/",
    },
    {
      domain: "hackernews.com",
      titleSuffix: "| Hacker News",
      descPrefix: "Tech community discussion about ",
      path: "/item/",
    },
  ],
  news: [
    {
      domain: "reuters.com",
      titleSuffix: "| Reuters",
      descPrefix: "Breaking news and analysis: ",
      path: "/world/",
    },
    {
      domain: "bbc.com",
      titleSuffix: "- BBC News",
      descPrefix: "Latest coverage from BBC News on ",
      path: "/news/",
    },
    {
      domain: "apnews.com",
      titleSuffix: "- AP News",
      descPrefix: "Associated Press reporting on ",
      path: "/article/",
    },
    {
      domain: "theguardian.com",
      titleSuffix: "| The Guardian",
      descPrefix: "In-depth journalism and commentary on ",
      path: "/world/",
    },
    {
      domain: "npr.org",
      titleSuffix: "| NPR",
      descPrefix: "NPR coverage of the latest developments in ",
      path: "/sections/",
    },
  ],
  shopping: [
    {
      domain: "amazon.com",
      titleSuffix: "| Amazon",
      descPrefix: "Shop for ",
      path: "/s?k=",
    },
    {
      domain: "ebay.com",
      titleSuffix: "| eBay",
      descPrefix: "Find deals on ",
      path: "/sch/i.html?_nkw=",
    },
    {
      domain: "walmart.com",
      titleSuffix: "- Walmart",
      descPrefix: "Everyday low prices on ",
      path: "/search?q=",
    },
  ],
};

const DESCRIPTION_PARTS = [
  "Learn everything about {q} with detailed guides, expert explanations, and up-to-date resources.",
  "Discover comprehensive information on {q}. Includes definitions, history, examples, and more.",
  "Explore {q} — find answers, tutorials, and reference materials from trusted sources.",
  "{q} explained: A complete guide covering all aspects, from basics to advanced topics.",
  "The definitive resource for {q}. Trusted by millions of users worldwide.",
  "Get the latest updates and information on {q} from industry experts and researchers.",
  "Everything you need to know about {q}: facts, insights, and actionable information.",
  "Comprehensive overview of {q} with practical examples and expert-verified content.",
];

function generateSearchResults(query: string): SearchResult[] {
  const q = query.toLowerCase();
  const rand = seededRandom(hashString(query + new Date().toDateString()));

  // Determine category
  let templateCategory: keyof typeof RESULT_TEMPLATES = "general";
  if (
    /code|javascript|python|react|css|html|typescript|api|dev|programming|software/.test(
      q,
    )
  ) {
    templateCategory = "tech";
  } else if (/news|latest|breaking|today|current|update/.test(q)) {
    templateCategory = "news";
  } else if (/buy|shop|price|cheap|deal|amazon|product/.test(q)) {
    templateCategory = "shopping";
  }

  const templates = [
    ...RESULT_TEMPLATES[templateCategory],
    ...RESULT_TEMPLATES.general.slice(0, 3),
  ];

  const results: SearchResult[] = [];
  const usedDomains = new Set<string>();

  // Always put Wikipedia first if not tech/shopping
  if (templateCategory === "general" || templateCategory === "news") {
    const wikiTemplate = RESULT_TEMPLATES.general[0];
    const slug = query.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    results.push({
      id: "wiki",
      title: `${query.charAt(0).toUpperCase() + query.slice(1)} ${wikiTemplate.titleSuffix}`,
      url: `https://en.${wikiTemplate.domain}${wikiTemplate.path}${slug}`,
      displayUrl: `en.${wikiTemplate.domain} › wiki › ${slug}`,
      description: `${wikiTemplate.descPrefix}${query}. This article covers the history, definition, key concepts, and notable examples related to ${query}. Sources are cited from peer-reviewed publications and expert contributors.`,
      category: "Encyclopedia",
    });
    usedDomains.add(wikiTemplate.domain);
  }

  // Generate remaining results
  const shuffled = [...templates].sort(() => rand() - 0.5);

  for (const template of shuffled) {
    if (results.length >= 8) break;
    if (usedDomains.has(template.domain)) continue;

    usedDomains.add(template.domain);

    const descIndex = Math.floor(rand() * DESCRIPTION_PARTS.length);
    const desc = DESCRIPTION_PARTS[descIndex].replace(/\{q\}/g, query);

    const slug = query
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const pathSlug = template.path.endsWith("/")
      ? slug
      : `${slug}${Math.floor(rand() * 999999) + 100000}`;

    const categories: Record<string, string> = {
      "wikipedia.org": "Encyclopedia",
      "reddit.com": "Community",
      "quora.com": "Q&A",
      "medium.com": "Articles",
      "britannica.com": "Encyclopedia",
      "stackoverflow.com": "Developer Q&A",
      "github.com": "Open Source",
      "developer.mozilla.org": "Documentation",
      "dev.to": "Dev Community",
      "hackernews.com": "Tech News",
      "reuters.com": "News",
      "bbc.com": "News",
      "apnews.com": "News",
      "theguardian.com": "News",
      "npr.org": "News",
      "amazon.com": "Shopping",
      "ebay.com": "Shopping",
      "walmart.com": "Shopping",
    };

    results.push({
      id: template.domain + pathSlug,
      title: `${query.charAt(0).toUpperCase() + query.slice(1)} ${template.titleSuffix}`,
      url: `https://www.${template.domain}${template.path}${pathSlug}`,
      displayUrl: `www.${template.domain} › ${slug}`,
      description: desc,
      category: categories[template.domain] || "Web",
    });
  }

  return results;
}

const CATEGORY_COLORS: Record<string, string> = {
  Encyclopedia: "oklch(0.55 0.18 240)",
  Community: "oklch(0.55 0.16 28)",
  "Q&A": "oklch(0.55 0.18 160)",
  Articles: "oklch(0.55 0.14 185)",
  "Developer Q&A": "oklch(0.55 0.18 240)",
  "Open Source": "oklch(0.52 0.18 310)",
  Documentation: "oklch(0.55 0.18 240)",
  "Dev Community": "oklch(0.52 0.16 155)",
  "Tech News": "oklch(0.62 0.2 55)",
  News: "oklch(0.52 0.18 0)",
  Shopping: "oklch(0.62 0.2 55)",
  Web: "oklch(0.5 0.012 260)",
};

interface ResultCardProps {
  result: SearchResult;
  index: number;
  query: string;
}

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const words = query.trim().split(/\s+/).filter(Boolean);
  const regex = new RegExp(
    `(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  const parts = text.split(regex);
  return parts.map((part, i) => {
    const k = `hl-${i}-${part.slice(0, 8)}`;
    return regex.test(part) ? (
      <mark
        key={k}
        style={{
          background: "oklch(0.72 0.15 55 / 0.2)",
          color: "oklch(0.82 0.14 55)",
          borderRadius: "2px",
          padding: "0 1px",
        }}
      >
        {part}
      </mark>
    ) : (
      <span key={k}>{part}</span>
    );
  });
}

function ResultCard({ result, index, query }: ResultCardProps) {
  const [hovered, setHovered] = useState(false);
  const color = CATEGORY_COLORS[result.category] || "oklch(0.5 0.012 260)";

  return (
    <motion.div
      data-ocid={`search.result.item.${index + 1}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="rounded-2xl p-4 cursor-pointer group"
      style={{
        background: hovered ? "oklch(0.12 0.008 260)" : "oklch(0.1 0.006 260)",
        border: `1px solid ${hovered ? "oklch(0.22 0.01 260)" : "oklch(0.16 0.008 260)"}`,
        transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered ? "0 4px 20px oklch(0 0 0 / 0.3)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => window.open(result.url, "_blank", "noopener,noreferrer")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category badge + URL */}
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
              style={{
                color,
                background: `${color.replace(")", " / 0.1)").replace("oklch(", "oklch(")}`,
              }}
            >
              {result.category}
            </span>
            <span
              className="text-[11px] truncate"
              style={{ color: "oklch(0.42 0.015 155)" }}
            >
              {result.displayUrl}
            </span>
          </div>

          {/* Title */}
          <h3
            className="text-sm font-semibold mb-1.5 line-clamp-1 transition-colors duration-150"
            style={{
              color: hovered ? "oklch(0.72 0.15 55)" : "oklch(0.88 0.01 260)",
            }}
          >
            {result.title}
          </h3>

          {/* Description */}
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: "oklch(0.48 0.01 260)" }}
          >
            {highlightQuery(result.description, query)}
          </p>
        </div>

        <ExternalLink
          size={13}
          className="flex-shrink-0 mt-1 transition-colors duration-150"
          style={{
            color: hovered ? "oklch(0.72 0.15 55)" : "oklch(0.3 0.01 260)",
          }}
        />
      </div>
    </motion.div>
  );
}

const TRENDING = [
  "Latest AI news",
  "JavaScript tutorials",
  "Climate change 2026",
  "Best smartphones",
  "Space exploration",
  "Healthy recipes",
];

export default function WebSearchPage() {
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const performSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setHasSearched(true);
    setSearchedQuery(trimmed);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 420));
    const res = generateSearchResults(trimmed);
    setResults(res);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleTrending = (t: string) => {
    setQuery(t);
    performSearch(t);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    setSearchedQuery("");
    inputRef.current?.focus();
  };

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
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="p-2 rounded-xl"
            style={{ background: "oklch(0.72 0.15 55 / 0.1)" }}
          >
            <Search size={18} style={{ color: "oklch(0.72 0.15 55)" }} />
          </div>
          <div>
            <h1
              className="text-lg font-bold tracking-wide gold-shimmer"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              ONYX SEARCH
            </h1>
            <p
              className="text-[11px]"
              style={{ color: "oklch(0.4 0.012 260)" }}
            >
              Search the web — get links & results
            </p>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "oklch(0.45 0.012 260)" }}
          />
          <input
            ref={inputRef}
            type="text"
            data-ocid="search.search_input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm outline-none transition-all"
            style={{
              background: "oklch(0.11 0.008 260)",
              border: "1px solid oklch(0.2 0.01 260)",
              color: "oklch(0.9 0.01 260)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "oklch(0.72 0.15 55 / 0.5)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "oklch(0.2 0.01 260)";
            }}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "oklch(0.4 0.01 260)" }}
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4"
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "oklch(0.38 0.01 260)" }}
            >
              Trending searches
            </p>
            <div
              className="flex flex-wrap gap-2"
              data-ocid="search.trending.panel"
            >
              {TRENDING.map((t, i) => (
                <button
                  key={t}
                  type="button"
                  data-ocid={`search.trending.${i + 1}`}
                  onClick={() => handleTrending(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                  style={{
                    background: "oklch(0.11 0.008 260)",
                    border: "1px solid oklch(0.18 0.01 260)",
                    color: "oklch(0.55 0.015 260)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "oklch(0.72 0.15 55 / 0.4)";
                    e.currentTarget.style.color = "oklch(0.72 0.15 55)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.18 0.01 260)";
                    e.currentTarget.style.color = "oklch(0.55 0.015 260)";
                  }}
                >
                  <Search size={11} />
                  {t}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 gap-3"
            data-ocid="search.loading_state"
          >
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: "oklch(0.72 0.15 55)" }}
            />
            <p className="text-sm" style={{ color: "oklch(0.4 0.012 260)" }}>
              Searching for "{searchedQuery}"...
            </p>
          </motion.div>
        )}

        {!loading && hasSearched && results.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={searchedQuery}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {/* Results count */}
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-[11px]"
                  style={{ color: "oklch(0.38 0.01 260)" }}
                >
                  About{" "}
                  {(
                    results.length * 12_300_000 +
                    (hashString(searchedQuery) % 5_000_000)
                  ).toLocaleString()}{" "}
                  results for{" "}
                  <strong style={{ color: "oklch(0.6 0.015 260)" }}>
                    "{searchedQuery}"
                  </strong>
                </p>
              </div>

              {results.map((result, i) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  index={i}
                  query={searchedQuery}
                />
              ))}

              <div
                className="text-center py-4 text-xs"
                style={{ color: "oklch(0.3 0.01 260)" }}
              >
                Showing top {results.length} results
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 gap-4"
            data-ocid="search.empty_state"
          >
            <div
              className="p-5 rounded-2xl"
              style={{ background: "oklch(0.12 0.008 260)" }}
            >
              <Search size={32} style={{ color: "oklch(0.35 0.01 260)" }} />
            </div>
            <p className="text-sm" style={{ color: "oklch(0.45 0.015 260)" }}>
              No results found for "{searchedQuery}"
            </p>
            <button
              type="button"
              onClick={clearSearch}
              className="text-xs px-4 py-2 rounded-xl transition-all"
              style={{
                background: "oklch(0.13 0.01 260)",
                border: "1px solid oklch(0.22 0.01 260)",
                color: "oklch(0.55 0.015 260)",
              }}
            >
              Try a different search
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
