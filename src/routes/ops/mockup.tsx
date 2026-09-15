import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getOpsSession } from "@/lib/server/ops";
import { MOCKUP_STUDIO_GZIP } from "@/lib/mockup-studio-data";

export const Route = createFileRoute("/ops/mockup")({ component: OpsMockupPage });

type AccessState = "loading" | "allowed" | "denied";

async function inflateMockupDocument(): Promise<string> {
  const binary = atob(MOCKUP_STUDIO_GZIP);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  if (!("DecompressionStream" in window)) throw new Error("This browser does not support the mockup renderer.");
  const stream = new Blob([bytes.buffer as ArrayBuffer]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

function OpsMockupPage() {
  const [access, setAccess] = useState<AccessState>("loading");
  const [documentHtml, setDocumentHtml] = useState("");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    void getOpsSession()
      .then(async (session) => {
        if (!active) return;
        if (!session.canAdmin) {
          setAccess("denied");
          return;
        }
        setAccess("allowed");
        try {
          const html = await inflateMockupDocument();
          if (active) setDocumentHtml(html);
        } catch {
          if (active) setLoadError(true);
        }
      })
      .catch(() => {
        if (active) setAccess("denied");
      });
    return () => {
      active = false;
    };
  }, []);

  if (access === "loading") {
    return <div className="h-64 animate-pulse rounded-2xl bg-elevated" />;
  }

  if (access === "denied") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-elevated p-6 text-center sm:p-8">
        <p className="text-xs font-medium tracking-widest text-subtle uppercase">Private tool</p>
        <h1 className="mt-2 font-display text-3xl text-fg">Admin access required</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">Mockup Studio is restricted to the administrator account.</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-elevated p-6 text-center sm:p-8">
        <h1 className="font-display text-3xl text-fg">Mockup Studio could not start</h1>
        <p className="mt-3 text-sm text-muted">Use a current version of Safari, Chrome, or Edge and reload this page.</p>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 overflow-hidden bg-black lg:-mx-8 lg:-my-8">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0b0b0c] px-4 py-3 text-white sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Mockup Studio</p>
          <p className="text-xs text-white/50">Private admin tool · processed on your device</p>
        </div>
        <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/65">Owner only</span>
      </div>
      {documentHtml ? (
        <iframe
          title="Mr Wallpaper Mockup Studio"
          srcDoc={documentHtml}
          allow="web-share; clipboard-write"
          className="block h-[calc(100dvh-9.5rem)] min-h-[720px] w-full border-0 bg-black lg:h-[calc(100dvh-3.5rem)] lg:min-h-[780px]"
        />
      ) : (
        <div className="h-[70dvh] animate-pulse bg-[#0b0b0c]" />
      )}
    </div>
  );
}
