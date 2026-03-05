import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EMOJI_CATEGORIES } from "@/lib/onyx-utils";
import { SmilePlus } from "lucide-react";
import { useState } from "react";

interface Props {
  onSelect: (emoji: string) => void;
}

type CategoryKey = keyof typeof EMOJI_CATEGORIES;

export default function EmojiPicker({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("Smileys");
  const categories = Object.keys(EMOJI_CATEGORIES) as CategoryKey[];

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-ocid="chat.button"
          className="p-2 rounded-lg transition-all duration-150 hover:scale-110"
          style={{ color: "oklch(0.55 0.015 260)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "oklch(0.72 0.15 55)";
            e.currentTarget.style.background = "oklch(0.15 0.01 260)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "oklch(0.55 0.015 260)";
            e.currentTarget.style.background = "transparent";
          }}
          title="Emoji"
          aria-label="Open emoji picker"
        >
          <SmilePlus size={18} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-ocid="chat.popover"
        side="top"
        align="start"
        className="p-0 w-72 border-0 shadow-2xl"
        style={{
          background: "oklch(0.13 0.01 260)",
          border: "1px solid oklch(0.22 0.01 260)",
          boxShadow: "0 16px 40px oklch(0 0 0 / 0.7)",
        }}
      >
        {/* Category tabs */}
        <div
          className="flex border-b"
          style={{ borderColor: "oklch(0.22 0.01 260)" }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="flex-1 py-2 text-[10px] tracking-wider transition-colors"
              style={{
                color:
                  activeCategory === cat
                    ? "oklch(0.72 0.15 55)"
                    : "oklch(0.45 0.015 260)",
                borderBottom:
                  activeCategory === cat
                    ? "2px solid oklch(0.72 0.15 55)"
                    : "2px solid transparent",
              }}
            >
              {cat.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div
          className="grid grid-cols-8 gap-0.5 p-2 max-h-48 overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg rounded-lg transition-all hover:scale-125"
              style={{ background: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "oklch(0.2 0.01 260)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
