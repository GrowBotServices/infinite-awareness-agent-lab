/** Scientific Ether: the result dock reads like a precise instrument, not a developer console. */
import { CheckCircle2, CircleDot, Copy, TerminalSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export type VisibleToolResult = {
  name: string;
  ok: boolean;
  at: string;
  output: unknown;
};

export function ToolResultDock({
  result,
  support,
  registeredCount,
}: {
  result: VisibleToolResult | null;
  support: "checking" | "available" | "fallback" | "error";
  registeredCount: number;
}) {
  const [copied, setCopied] = useState(false);
  const formatted = result ? JSON.stringify(result.output, null, 2) : "";

  const copyResult = async () => {
    if (!formatted) return;
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <aside className="result-dock" aria-label="Latest tool result">
      <div className="result-dock__heading">
        <div>
          <span className="eyebrow">Visible tool result</span>
          <h2>Agent activity</h2>
        </div>
        <TerminalSquare size={18} aria-hidden="true" />
      </div>

      <div className={`capability-state capability-state--${support}`}>
        <CircleDot size={15} aria-hidden="true" />
        <div>
          <strong>
            {support === "available"
              ? "WebMCP available"
              : support === "checking"
                ? "Checking WebMCP"
                : support === "error"
                  ? "Registration needs attention"
                  : "Visible-page fallback"}
          </strong>
          <span>
            {support === "available"
              ? `${registeredCount || 8} of 8 tools registered`
              : "All eight actions remain usable on this page"}
          </span>
        </div>
      </div>

      {result ? (
        <div className="result-card" data-ok={result.ok}>
          <div className="result-card__meta">
            <span className="mono">{result.name}</span>
            <span>{result.at}</span>
          </div>
          <div className="result-card__status">
            <CheckCircle2 size={16} aria-hidden="true" />
            {result.ok ? "Completed visibly" : "Boundary enforced"}
          </div>
          <pre>{formatted}</pre>
          <Button variant="outline" size="sm" className="result-copy" onClick={copyResult}>
            <Copy size={14} aria-hidden="true" />
            {copied ? "Copied" : "Copy result"}
          </Button>
        </div>
      ) : (
        <div className="result-empty">
          <div className="signal-orbit" aria-hidden="true"><span /></div>
          <h3>No tool called yet</h3>
          <p>Ask an agent for today’s protocol, or use any visible fallback action. Every result appears here.</p>
        </div>
      )}

      <p className="result-dock__footnote">
        Tool inputs contain no confirmation token. Save and score permission exists only in visible page state.
      </p>
    </aside>
  );
}
