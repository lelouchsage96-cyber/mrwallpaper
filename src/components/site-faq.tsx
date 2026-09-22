import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

const items: Array<{ id: string; question: string; answer: ReactNode }> = [
  {
    id: "free",
    question: "Are wallpapers on Mr Wallpapers free?",
    answer: <>Yes. Published wallpapers on Mr Wallpapers are free to browse and download. There is no premium wallpaper tier.</>,
  },
  {
    id: "account",
    question: "Do I need an account to download wallpapers?",
    answer: <>No. You can browse and download published wallpapers without signing in. An account is required for community features such as submitting a wallpaper.</>,
  },
  {
    id: "devices",
    question: "Which devices are supported?",
    answer: <>The catalog includes wallpapers for iPhone, Android phones, iPad and other tablets. Check the wallpaper dimensions and preview to choose the best fit for your screen.</>,
  },
  {
    id: "4k",
    question: "Are all wallpapers available in 4K?",
    answer: <>No. The library includes both HD and 4K wallpapers, depending on the source image. We do not label a wallpaper as 4K unless its resolution supports it.</>,
  },
  {
    id: "submit",
    question: "How do I submit a wallpaper?",
    answer: (
      <>
        Sign in and use the{" "}
        <a href="/studio/submit" className="font-medium text-fg underline underline-offset-4">
          Submit a wallpaper
        </a>{" "}
        page. You can add the details manually or use the optional OpenAI metadata tool before sending it for review.
      </>
    ),
  },
  {
    id: "approval",
    question: "Are submitted wallpapers published automatically?",
    answer: <>No. Every community submission stays private until it is manually reviewed and approved by Mr Wallpapers.</>,
  },
  {
    id: "allowed",
    question: "What can I submit?",
    answer: <>Submit only images you created or have permission to share and distribute. Do not upload copyrighted material you do not have the right to provide.</>,
  },
  {
    id: "copyright",
    question: "How can I report a copyright issue?",
    answer: (
      <>
        Use our{" "}
        <a href={brand.legal.copyright} className="font-medium text-fg underline underline-offset-4">
          Copyright Complaint
        </a>{" "}
        page and include the relevant wallpaper or page URL so the report can be reviewed.
      </>
    ),
  },
];

function FaqItem({ id, question, answer }: (typeof items)[number]) {
  const [open, setOpen] = useState(false);
  const contentId = `faq-answer-${id}`;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-elevated/80 transition-[background-color,border-color,box-shadow] duration-200",
        "hover:border-fg/15 hover:bg-surface/80",
        open && "border-fg/15 bg-surface/70 shadow-[0_10px_28px_rgba(0,0,0,0.10)]",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-medium text-fg sm:px-5"
      >
        <span>{question}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-muted transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-250 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div id={contentId} className="px-4 pb-4 text-sm leading-6 text-muted sm:px-5">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteFaq() {
  const left = items.filter((_, index) => index % 2 === 0);
  const right = items.filter((_, index) => index % 2 === 1);

  return (
    <section aria-label="Frequently asked questions">
      <div className="grid gap-3 lg:hidden">
        {items.map((item) => <FaqItem key={item.id} {...item} />)}
      </div>

      <div className="hidden gap-3 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="space-y-3">
          {left.map((item) => <FaqItem key={item.id} {...item} />)}
        </div>
        <div className="space-y-3">
          {right.map((item) => <FaqItem key={item.id} {...item} />)}
        </div>
      </div>
    </section>
  );
}
