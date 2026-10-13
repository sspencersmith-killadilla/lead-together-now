// Parse a people spreadsheet (CSV) into rows Tandem can import.
// Accepts a simple Tandem layout (name, email, manager email, role) and the
// "Download users" CSV from the Google Workspace admin console.

export type ImportRow = { name: string; email: string; manager_email: string; role: "member" | "admin" };
export type ParsedImport = { rows: ImportRow[]; problems: string[] };

export function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); out.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); out.push(row); }
  return out.filter((r) => r.some((v) => v.trim() !== ""));
}

const norm = (h: string) => h.toLowerCase().replace(/\[.*?\]/g, "").replace(/[^a-z]/g, "");
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function findCol(headers: string[], names: string[]) {
  return headers.findIndex((h) => names.includes(norm(h)));
}

export function parsePeople(text: string): ParsedImport {
  const table = parseCsv(text);
  const problems: string[] = [];
  if (table.length < 2) return { rows: [], problems: ["The file needs a header row and at least one person."] };
  const headers = table[0]!;
  const email = findCol(headers, ["email", "emailaddress", "workemail", "primaryemail"]);
  const name = findCol(headers, ["name", "fullname", "displayname"]);
  const first = findCol(headers, ["firstname", "givenname"]);
  const last = findCol(headers, ["lastname", "familyname", "surname"]);
  const manager = findCol(headers, ["manager", "manageremail", "leader", "leaderemail", "reportsto"]);
  const role = findCol(headers, ["role", "tandemrole"]);
  if (email < 0) return { rows: [], problems: ["Couldn't find an email column. Name one column \"Email\"."] };

  const seen = new Set<string>();
  const rows: ImportRow[] = [];
  table.slice(1).forEach((cells, i) => {
    const line = i + 2;
    const get = (idx: number) => (idx >= 0 ? (cells[idx] ?? "").trim() : "");
    const em = get(email).toLowerCase();
    if (!EMAIL.test(em)) { problems.push(`Row ${line}: "${get(email) || "(blank)"}" isn't a valid email — skipped.`); return; }
    if (seen.has(em)) { problems.push(`Row ${line}: ${em} appears more than once — kept the first.`); return; }
    seen.add(em);
    let mgr = get(manager).toLowerCase();
    if (mgr && !EMAIL.test(mgr)) { problems.push(`Row ${line}: manager "${get(manager)}" isn't an email — left blank.`); mgr = ""; }
    if (mgr === em) mgr = "";
    const full = get(name) || [get(first), get(last)].filter(Boolean).join(" ");
    rows.push({ name: full, email: em, manager_email: mgr, role: get(role).toLowerCase() === "admin" ? "admin" : "member" });
  });
  return { rows, problems };
}

export const SAMPLE_CSV = "Name,Email,Manager Email,Role\nJordan Lee,jordan@example.org,,admin\nPriya Shah,priya@example.org,jordan@example.org,member\n";
