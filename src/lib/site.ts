// Default help contact shown when a workspace hasn't set its own. Self-hosters: change this.
export const DEFAULT_SUPPORT = "help@tandem.civicplexus.org";
export const supportHref = (c: string) => (c.includes("@") && !c.startsWith("http") ? `mailto:${c}` : c);
