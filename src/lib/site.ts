// Default help contact shown when a workspace hasn't set its own. Self-hosters: change this.
export const DEFAULT_SUPPORT = "help@tandem.civicplexus.org";
// The default address has no inbox — help requests go through the contact form,
// which forwards them to the site owner without revealing their address.
export const supportHref = (c: string) =>
  c === DEFAULT_SUPPORT ? "/help" : c.includes("@") && !c.startsWith("http") ? `mailto:${c}` : c;
