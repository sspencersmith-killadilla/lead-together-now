import { describe, expect, it } from "vitest";
import { parsePeople } from "./people-import";

describe("parsePeople", () => {
  it("reads the simple layout with managers and roles", () => {
    const r = parsePeople("Name,Email,Manager Email,Role\nJo Lee,JO@x.org,,admin\nPri,pri@x.org,jo@x.org,member\n");
    expect(r.rows).toEqual([
      { name: "Jo Lee", email: "jo@x.org", manager_email: "", role: "admin" },
      { name: "Pri", email: "pri@x.org", manager_email: "jo@x.org", role: "member" },
    ]);
  });

  it("reads a Google Workspace admin export", () => {
    const r = parsePeople('First Name [Required],Last Name [Required],Email Address [Required],Manager Email\n"Ann","Cole",ann@x.org,boss@x.org\n');
    expect(r.rows[0]).toEqual({ name: "Ann Cole", email: "ann@x.org", manager_email: "boss@x.org", role: "member" });
  });

  it("skips invalid and duplicate emails", () => {
    const r = parsePeople("Email\nnope\na@x.org\nA@x.org\n");
    expect(r.rows).toHaveLength(1);
    expect(r.problems).toHaveLength(2);
  });

  it("requires an email column", () => {
    expect(parsePeople("Name\nJo\n").rows).toHaveLength(0);
  });
});
