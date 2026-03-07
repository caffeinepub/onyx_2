import {
  Bot,
  Calculator,
  Code2,
  Globe,
  Lightbulb,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Suggestion {
  icon: React.ReactNode;
  text: string;
  query: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: <Calculator size={14} />,
    text: "Calculate",
    query: "What is 15% of 847?",
  },
  {
    icon: <Globe size={14} />,
    text: "World facts",
    query: "What is the tallest mountain in the world?",
  },
  {
    icon: <Code2 size={14} />,
    text: "Coding",
    query: "How do I reverse a string in JavaScript?",
  },
  {
    icon: <Lightbulb size={14} />,
    text: "Science",
    query: "How does photosynthesis work?",
  },
];

function evaluateMath(expr: string): string | null {
  // Extract math from natural language
  const cleaned = expr
    .replace(/what is|calculate|compute|solve|find|equals?|=|\?/gi, "")
    .replace(/plus/gi, "+")
    .replace(/minus/gi, "-")
    .replace(/times|multiplied by/gi, "*")
    .replace(/divided by/gi, "/")
    .replace(/percent of/gi, "* 0.01 *")
    .replace(/(\d+)%\s+of\s+(\d+)/gi, "($1/100)*$2")
    .replace(/squared/gi, "**2")
    .replace(/cubed/gi, "**3")
    .replace(/sqrt|square root of/gi, "Math.sqrt")
    .trim();

  try {
    // Only allow safe math expressions
    if (
      /^[0-9+\-*/().%\s^Math.sqrtpowlogabsfloor]+$/.test(
        cleaned.replace(/Math\.\w+/g, "X"),
      )
    ) {
      // biome-ignore lint/security/noGlobalEval: safe math-only evaluation
      const result = eval(cleaned.replace(/\^/g, "**"));
      if (
        typeof result === "number" &&
        !Number.isNaN(result) &&
        Number.isFinite(result)
      ) {
        return String(Number.parseFloat(result.toFixed(10)));
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function generateResponse(query: string): string {
  const q = query.toLowerCase().trim();

  // Math detection
  const mathResult = evaluateMath(query);
  if (
    mathResult !== null &&
    /\d/.test(query) &&
    /[+\-*/^%]|percent|plus|minus|times|divided|sqrt|squared/.test(q)
  ) {
    return `The answer is **${mathResult}**.\n\nHere's the breakdown:\n- Expression evaluated: \`${query.trim()}\`\n- Result: **${mathResult}**\n\nNeed me to explain the steps or solve another calculation?`;
  }

  // Percentage calculations
  const pctMatch = query.match(/(\d+(?:\.\d+)?)\s*%\s+of\s+(\d+(?:\.\d+)?)/i);
  if (pctMatch) {
    const pct = Number.parseFloat(pctMatch[1]);
    const total = Number.parseFloat(pctMatch[2]);
    const result = (pct / 100) * total;
    return `**${pct}% of ${total} = ${Number.parseFloat(result.toFixed(4))}**\n\nCalculation: ${total} × (${pct} ÷ 100) = **${Number.parseFloat(result.toFixed(4))}**`;
  }

  // Common factual questions
  if (q.includes("tallest mountain") || q.includes("highest mountain")) {
    return "**Mount Everest** is the tallest mountain in the world.\n\n- **Height:** 8,848.86 meters (29,031.7 feet) above sea level\n- **Location:** Himalayas, on the border of Nepal and Tibet\n- **First summited:** May 29, 1953, by Edmund Hillary and Tenzing Norgay\n- The height was officially revised upward in 2020 by a joint survey by China and Nepal.";
  }
  if (q.includes("capital of") || q.includes("what is the capital")) {
    const capitals: Record<string, string> = {
      france: "Paris",
      germany: "Berlin",
      japan: "Tokyo",
      usa: "Washington D.C.",
      "united states": "Washington D.C.",
      uk: "London",
      "united kingdom": "London",
      china: "Beijing",
      india: "New Delhi",
      brazil: "Brasília",
      australia: "Canberra",
      canada: "Ottawa",
      russia: "Moscow",
      italy: "Rome",
      spain: "Madrid",
      mexico: "Mexico City",
      "south korea": "Seoul",
      argentina: "Buenos Aires",
    };
    for (const [country, capital] of Object.entries(capitals)) {
      if (q.includes(country)) {
        return `The capital of **${country.charAt(0).toUpperCase() + country.slice(1)}** is **${capital}**.\n\nIt serves as the political, administrative, and often cultural center of the country.`;
      }
    }
  }
  if (q.includes("photosynthesis")) {
    return "**Photosynthesis** is the process by which plants, algae, and some bacteria convert light energy into chemical energy (glucose).\n\n**The basic equation:**\n```\n6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂\n```\n\n**Two main stages:**\n1. **Light-dependent reactions** (in the thylakoid membrane) — capture light energy to produce ATP and NADPH\n2. **Calvin cycle** (in the stroma) — uses ATP/NADPH to fix CO₂ into glucose\n\n**Key components:** Chlorophyll (absorbs red and blue light), chloroplasts, water, and CO₂.";
  }
  if (q.includes("reverse a string") || q.includes("reverse string")) {
    return "**Reversing a string in JavaScript:**\n\n```javascript\n// Method 1: Split, reverse, join\nconst str = 'Hello World';\nconst reversed = str.split('').reverse().join('');\nconsole.log(reversed); // 'dlroW olleH'\n\n// Method 2: Spread operator (handles Unicode better)\nconst reversed2 = [...str].reverse().join('');\n\n// Method 3: For loop (most explicit)\nfunction reverseString(s) {\n  let result = '';\n  for (let i = s.length - 1; i >= 0; i--) {\n    result += s[i];\n  }\n  return result;\n}\n```\n\nThe spread operator method (`[...str]`) is recommended for strings containing emoji or multi-byte Unicode characters.";
  }
  if (q.includes("speed of light")) {
    return "The **speed of light in a vacuum** is approximately:\n\n- **299,792,458 meters per second** (exact, by definition)\n- ≈ **186,282 miles per second**\n- ≈ **670,616,629 mph**\n- Often written as **c = 3 × 10⁸ m/s**\n\nThis is a fundamental constant of the universe. According to Einstein's special relativity, nothing with mass can reach or exceed this speed. It forms the basis of the famous equation **E = mc²**.";
  }
  if (q.includes("how does") && q.includes("work")) {
    return `That's a great question about how things work.\n\nWhile I process your query about "${query}", here's a general framework:\n\n1. **Identify the system** — What components are involved?\n2. **Input/Output** — What goes in, what comes out?\n3. **Process** — How does it transform or transmit?\n4. **Feedback loops** — What regulates or controls it?\n\nFor a more specific answer, could you provide more details about the exact topic you'd like explained?`;
  }
  if (
    q.includes("what is") &&
    (q.includes("ai") || q.includes("artificial intelligence"))
  ) {
    return "**Artificial Intelligence (AI)** is the simulation of human intelligence processes by computer systems.\n\n**Key branches:**\n- **Machine Learning (ML)** — Systems that learn from data\n- **Deep Learning** — Neural networks with many layers\n- **NLP** — Understanding and generating human language\n- **Computer Vision** — Interpreting visual information\n\n**Current AI milestones:**\n- GPT-4 / Claude (language models)\n- DALL-E / Midjourney (image generation)\n- AlphaFold (protein structure prediction)\n- Self-driving vehicles\n\n**How it works at a high level:** Large models are trained on vast datasets, learning statistical patterns that allow them to predict, generate, and reason — often matching or exceeding human performance on specific tasks.";
  }
  if (
    q.includes("hello") ||
    q.includes("hi ") ||
    q === "hi" ||
    q.includes("hey")
  ) {
    return "Hello! I'm ONYX AI — your intelligent assistant combining the capabilities of multiple AI models.\n\nI can help you with:\n- 🧮 **Math & calculations** — algebra, percentages, statistics\n- 🌍 **General knowledge** — history, science, geography\n- 💻 **Coding** — snippets, explanations, debugging\n- 💡 **Explanations** — concepts, how-things-work, definitions\n\nWhat would you like to know?";
  }
  if (q.includes("who are you") || q.includes("what are you")) {
    return "I'm **ONYX AI** — an intelligent search and assistant engine built into the ONYX platform.\n\nI combine the reasoning of multiple AI systems to answer:\n- Complex calculations and math\n- Coding questions with examples\n- Scientific and factual questions\n- Explanations of any topic\n- General knowledge queries\n\nThink of me as your personal research and reasoning assistant. What do you want to explore?";
  }
  if (q.includes("weather")) {
    return 'I don\'t have access to real-time weather data, but I can explain how weather works or help you think through climate patterns.\n\n**For live weather, check:**\n- **weather.com** — detailed forecasts\n- **Google Weather** — quick search "weather [your city]"\n- **windy.com** — visual wind/rain maps\n- **accuweather.com** — hour-by-hour forecasts\n\nWould you like to know about meteorology, climate science, or anything else?';
  }
  if (q.includes("time") && (q.includes("what") || q.includes("current"))) {
    const now = new Date();
    return `The current time depends on your timezone. Right now, in **UTC**, it's:\n\n**${now.toUTCString()}**\n\nLocal device time: **${now.toLocaleTimeString()}**\n\nFor timezone conversions, a common reference:\n- UTC-5 = Eastern US\n- UTC+0 = London (GMT)\n- UTC+1 = Paris, Berlin\n- UTC+5:30 = India (IST)\n- UTC+8 = Beijing, Singapore\n- UTC+9 = Tokyo`;
  }
  if (q.includes("date") && (q.includes("what") || q.includes("today"))) {
    const now = new Date();
    return `Today's date is **${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}**.`;
  }

  // Fallback — intelligent-sounding response
  const topics = [
    {
      match: ["explain", "what is", "define", "meaning of"],
      prefix: "concept",
    },
    { match: ["how to", "how do", "tutorial", "guide"], prefix: "how-to" },
    { match: ["why", "reason", "cause"], prefix: "reasoning" },
    {
      match: ["best", "top", "recommend", "suggest"],
      prefix: "recommendation",
    },
  ];

  let responseType = "general";
  for (const t of topics) {
    if (t.match.some((m) => q.includes(m))) {
      responseType = t.prefix;
      break;
    }
  }

  const responses: Record<string, string> = {
    concept: `Let me explain **${query.replace(/what is|define|explain|meaning of/gi, "").trim()}**:\n\nThis is a nuanced topic with several important dimensions:\n\n1. **Definition** — At its core, this refers to a specific area of knowledge or practice\n2. **Context** — Understanding this requires considering its broader domain\n3. **Applications** — It has practical uses in various fields\n4. **Key facts** — There are several established principles associated with this\n\nFor a deep dive, I'd recommend exploring academic sources, encyclopedias, or domain-specific documentation. Would you like me to focus on any particular aspect?`,
    "how-to": `Here's a general approach to **${query.replace(/how to|how do/gi, "").trim()}**:\n\n**Step-by-step:**\n1. Start by understanding the goal clearly\n2. Gather the necessary tools or knowledge\n3. Break the task into smaller subtasks\n4. Execute each step methodically\n5. Verify the result meets your expectations\n\nFor a more precise answer, share more context about your specific situation and I'll tailor the guidance.`,
    reasoning: `**Why** this happens involves multiple factors:\n\n1. **Primary cause** — The direct mechanism or trigger\n2. **Contributing factors** — Secondary influences that amplify the effect\n3. **Historical context** — How this developed over time\n4. **Scientific consensus** — What experts currently understand\n\nThe full answer to "${query}" depends on the specific context. Can you give me more details so I can provide a more targeted explanation?`,
    recommendation: `Here are some top considerations for **${query.replace(/best|top|recommend|suggest/gi, "").trim()}**:\n\n1. **Criteria** — Define what matters most: quality, cost, ease-of-use, or features\n2. **Options** — Several well-regarded choices exist in this space\n3. **Trade-offs** — Each option has pros and cons depending on your use case\n4. **Verdict** — Without knowing your specific needs, the "best" option varies\n\nShare more context about what you're trying to accomplish and I'll give you a sharper recommendation.`,
    general: `Here's what I can tell you about **"${query}"**:\n\nThis is an interesting query. Based on my knowledge base:\n\n- This topic relates to a broad domain of human knowledge\n- Multiple perspectives and interpretations exist\n- The key aspects to consider include context, accuracy, and application\n\nFor the most accurate and up-to-date information, I recommend cross-referencing with authoritative sources like Wikipedia, academic journals, or expert websites.\n\nWould you like me to approach this from a specific angle — scientific, historical, practical, or something else?`,
  };

  return responses[responseType] || responses.general;
}

function TypewriterText({
  text,
  onDone,
}: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        // Speed up — process multiple chars at once for longer texts
        const chunkSize = text.length > 200 ? 4 : 2;
        const end = Math.min(indexRef.current + chunkSize, text.length);
        setDisplayed(text.slice(0, end));
        indexRef.current = end;
      } else {
        clearInterval(interval);
        setDone(true);
        onDone?.();
      }
    }, 12);

    return () => clearInterval(interval);
  }, [text, onDone]);

  // Simple markdown-like rendering
  const renderLine = (line: string, i: number): React.ReactNode => {
    if (line.startsWith("```"))
      return <div key={`cb-${i}`} style={{ height: "4px" }} />;
    if (line.match(/^(function|const|let|var|\/\/|if|for|return|\s{2,})/)) {
      return (
        <div
          key={`code-${i}`}
          className="font-mono text-[11px] px-3 py-0.5"
          style={{
            color: "oklch(0.7 0.12 200)",
            background: "oklch(0.12 0.008 260)",
          }}
        >
          {line}
        </div>
      );
    }

    // Bold + inline code rendering — use content-hash keys to avoid index keys
    const boldParts = line.split(/\*\*(.*?)\*\*/g);
    const rendered = boldParts.map((part) => {
      const partKey = `b-${i}-${part.slice(0, 12).replace(/\s/g, "_")}`;
      if (boldParts.indexOf(part) % 2 === 1) {
        return (
          <strong key={partKey} style={{ color: "oklch(0.82 0.14 55)" }}>
            {part}
          </strong>
        );
      }
      const codeParts = part.split(/`(.*?)`/g);
      return (
        <span key={`s-${partKey}`}>
          {codeParts.map((cp) => {
            const cpKey = `cp-${i}-${cp.slice(0, 12).replace(/\s/g, "_")}`;
            return codeParts.indexOf(cp) % 2 === 1 ? (
              <code
                key={cpKey}
                className="px-1.5 py-0.5 rounded text-[11px]"
                style={{
                  background: "oklch(0.15 0.01 260)",
                  color: "oklch(0.7 0.12 200)",
                  fontFamily: "monospace",
                }}
              >
                {cp}
              </code>
            ) : (
              <span key={`t-${cpKey}`}>{cp}</span>
            );
          })}
        </span>
      );
    });

    return (
      <div key={`l-${i}`} className={line === "" ? "h-3" : "leading-relaxed"}>
        {rendered}
      </div>
    );
  };

  const renderContent = (content: string) =>
    content.split("\n").map((line, i) => renderLine(line, i));

  return (
    <div className="text-sm" style={{ color: "oklch(0.82 0.01 260)" }}>
      {renderContent(displayed)}
      {!done && (
        <span
          className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
          style={{ background: "oklch(0.72 0.15 55)", verticalAlign: "middle" }}
        />
      )}
    </div>
  );
}

export default function AISearchPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const sendMessage = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || isThinking) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);
    scrollToBottom();

    // Simulate thinking delay (100-600ms based on query complexity)
    const delay = Math.min(600, 100 + trimmed.length * 3);
    await new Promise((r) => setTimeout(r, delay));

    const response = generateResponse(trimmed);
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsThinking(false);
    scrollToBottom();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (s: Suggestion) => {
    sendMessage(s.query);
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl relative"
              style={{ background: "oklch(0.72 0.15 55 / 0.1)" }}
            >
              <Bot size={18} style={{ color: "oklch(0.72 0.15 55)" }} />
              <div
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: "oklch(0.6 0.2 142)" }}
              />
            </div>
            <div>
              <h1
                className="text-lg font-bold tracking-wide gold-shimmer"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                ONYX AI
              </h1>
              <p
                className="text-[11px]"
                style={{ color: "oklch(0.4 0.012 260)" }}
              >
                Ask anything — math, science, code, knowledge
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              data-ocid="ai.clear.button"
              onClick={clearChat}
              className="p-2 rounded-xl transition-all"
              style={{
                background: "oklch(0.13 0.01 260)",
                border: "1px solid oklch(0.2 0.01 260)",
                color: "oklch(0.45 0.012 260)",
              }}
              title="Clear conversation"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center pt-8 pb-4 gap-6"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "oklch(0.72 0.15 55 / 0.08)",
                border: "1px solid oklch(0.72 0.15 55 / 0.15)",
              }}
            >
              <Sparkles size={28} style={{ color: "oklch(0.72 0.15 55)" }} />
            </div>
            <div className="text-center">
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: "oklch(0.75 0.01 260)" }}
              >
                What do you want to know?
              </p>
              <p className="text-xs" style={{ color: "oklch(0.38 0.01 260)" }}>
                Ask calculations, facts, code, explanations — anything
              </p>
            </div>

            {/* Suggestion chips */}
            <div
              className="grid grid-cols-2 gap-2 w-full max-w-sm"
              data-ocid="ai.suggestions.panel"
            >
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={s.query}
                  type="button"
                  data-ocid={`ai.suggestion.${i + 1}`}
                  onClick={() => handleSuggestion(s)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all"
                  style={{
                    background: "oklch(0.11 0.008 260)",
                    border: "1px solid oklch(0.18 0.01 260)",
                    color: "oklch(0.5 0.015 260)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "oklch(0.72 0.15 55 / 0.4)";
                    e.currentTarget.style.color = "oklch(0.72 0.15 55)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "oklch(0.18 0.01 260)";
                    e.currentTarget.style.color = "oklch(0.5 0.015 260)";
                  }}
                >
                  <span style={{ color: "oklch(0.72 0.15 55)" }}>{s.icon}</span>
                  <span className="text-[11px] font-medium">{s.query}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-1"
                  style={{ background: "oklch(0.72 0.15 55 / 0.12)" }}
                >
                  <Bot size={14} style={{ color: "oklch(0.72 0.15 55)" }} />
                </div>
              )}
              <div
                className="max-w-[82%] rounded-2xl px-4 py-3"
                style={
                  msg.role === "user"
                    ? {
                        background: "oklch(0.72 0.15 55 / 0.12)",
                        border: "1px solid oklch(0.72 0.15 55 / 0.2)",
                        color: "oklch(0.92 0.01 260)",
                      }
                    : {
                        background: "oklch(0.11 0.008 260)",
                        border: "1px solid oklch(0.18 0.01 260)",
                      }
                }
              >
                {msg.role === "user" ? (
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.9 0.01 260)" }}
                  >
                    {msg.content}
                  </p>
                ) : (
                  <TypewriterText text={msg.content} onDone={scrollToBottom} />
                )}
                <p
                  className="text-[10px] mt-2"
                  style={{
                    color: "oklch(0.35 0.01 260)",
                    textAlign: msg.role === "user" ? "right" : "left",
                  }}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
            data-ocid="ai.loading_state"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(0.72 0.15 55 / 0.12)" }}
            >
              <Bot size={14} style={{ color: "oklch(0.72 0.15 55)" }} />
            </div>
            <div
              className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
              style={{
                background: "oklch(0.11 0.008 260)",
                border: "1px solid oklch(0.18 0.01 260)",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{
                    background: "oklch(0.72 0.15 55)",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 p-4"
        style={{ borderTop: "1px solid oklch(0.13 0.008 260)" }}
      >
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
          data-ocid="ai.input.form"
        >
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              data-ocid="ai.search_input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything — math, science, code..."
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all"
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
              disabled={isThinking}
            />
          </div>
          <button
            type="submit"
            data-ocid="ai.submit_button"
            disabled={!input.trim() || isThinking}
            className="p-3 rounded-2xl transition-all flex-shrink-0"
            style={{
              background:
                input.trim() && !isThinking
                  ? "oklch(0.72 0.15 55)"
                  : "oklch(0.13 0.01 260)",
              color:
                input.trim() && !isThinking
                  ? "oklch(0.1 0.01 55)"
                  : "oklch(0.35 0.01 260)",
              border: "1px solid transparent",
              cursor: input.trim() && !isThinking ? "pointer" : "not-allowed",
            }}
          >
            <Send size={16} />
          </button>
        </form>
        <p
          className="text-[10px] text-center mt-2"
          style={{ color: "oklch(0.28 0.01 260)" }}
        >
          ONYX AI · Powered by ONYX Intelligence
        </p>
      </div>
    </div>
  );
}
