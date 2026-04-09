import { useState } from "react";
import { Ticket, Send, Loader2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AiPromptBarProps {
  onFetchJira: (issueKey: string) => void;
  isLoading?: boolean;
  aiGenerating?: boolean;
  loadedTicket?: { key: string; summary: string } | null;
}

function parseJiraInput(input: string): string | null {
  const trimmed = input.trim();

  // Direct key like PROJ-123
  if (/^[A-Z][A-Z0-9]+-\d+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Jira URL: https://xxx.atlassian.net/browse/PROJ-123
  const browseMatch = trimmed.match(/atlassian\.net\/browse\/([A-Z][A-Z0-9]+-\d+)/i);
  if (browseMatch) return browseMatch[1].toUpperCase();

  // Jira URL: https://xxx.atlassian.net/jira/software/.../board?selectedIssue=PROJ-123
  const paramMatch = trimmed.match(/selectedIssue=([A-Z][A-Z0-9]+-\d+)/i);
  if (paramMatch) return paramMatch[1].toUpperCase();

  return null;
}

export function AiPromptBar({ onFetchJira, isLoading, aiGenerating, loadedTicket }: AiPromptBarProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState("");

  const isBusy = isLoading || aiGenerating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const key = parseJiraInput(input);
    if (!key) {
      setError("Enter a valid Jira key (e.g. PROJ-123) or Jira URL");
      return;
    }
    if (!isBusy) {
      onFetchJira(key);
      setInput("");
    }
  };

  return (
    <div
      className={cn(
        "border rounded-lg bg-card transition-all duration-200",
        isExpanded ? "ring-2 ring-primary/20 border-primary/40" : "border-border/60"
      )}
    >
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2">
        <Ticket className="h-4 w-4 text-primary shrink-0" />
        <Input
          placeholder="Enter Jira ID (e.g. PROJ-123) or paste Jira link..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError("");
          }}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => !input && setIsExpanded(false)}
          className="border-0 shadow-none h-8 text-sm px-0 focus-visible:ring-0"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!input.trim() || isBusy}
          className="h-7 px-3 shrink-0"
        >
          {isBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5 mr-1" />
              Fetch
            </>
          )}
        </Button>
      </form>

      {(isExpanded || error || loadedTicket) && (
        <div className="px-3 pb-2 space-y-1.5">
          {error && <p className="text-[11px] text-destructive">{error}</p>}
          {isLoading && (
            <p className="text-[11px] text-muted-foreground">Fetching Jira issue...</p>
          )}
          {aiGenerating && (
            <p className="text-[11px] text-muted-foreground">AI generating form...</p>
          )}
          {!error && !loadedTicket && !isBusy && (
            <p className="text-[11px] text-muted-foreground">
              Paste a Jira ticket ID or link to auto-generate form fields from the requirement.
            </p>
          )}
          {loadedTicket && (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Ticket className="h-2.5 w-2.5" />
                {loadedTicket.key}
              </Badge>
              <span className="text-[11px] text-muted-foreground truncate">
                {loadedTicket.summary}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
