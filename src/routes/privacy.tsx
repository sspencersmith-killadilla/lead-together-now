import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { DEFAULT_SUPPORT, supportHref } from "@/lib/site";

const title = "Privacy policy — Tandem";
const description = "What Tandem collects, who can see it, and how to export or delete your data.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="October 5, 2026">
      <p>Tandem is built so that 1-on-1 conversations stay between the two people having them. This page explains what we store and who can see it.</p>
      <h2>What we store</h2>
      <ul>
        <li><strong>Account details:</strong> your name and email address.</li>
        <li><strong>Workspace details:</strong> workspace name, branding, members and their roles, and pending invitations.</li>
        <li><strong>1-on-1 content:</strong> agendas, shared notes, private notes, action items and AI summaries.</li>
        <li><strong>Activity log:</strong> a record of administrative events, such as invitations, role changes and deleted sessions. It never contains note text.</li>
      </ul>
      <h2>Who can see what</h2>
      <ul>
        <li><strong>Private notes:</strong> only the person who wrote them. Nobody else, including admins, can read them, and they are never sent to AI.</li>
        <li><strong>Shared notes, agendas and action items:</strong> the two people in the 1-on-1 and, for reporting relationships, the leader's own leader (skip-level).</li>
        <li><strong>Admins:</strong> manage people, templates and settings. They can't read 1-on-1 notes.</li>
      </ul>
      <h2>AI</h2>
      <p>When AI is turned on, shared content from a single 1-on-1 is sent to an AI provider to write a summary or suggest action items. Private notes are never sent. Admins can turn AI off.</p>
      <h2>Emails</h2>
      <p>We send invitation emails and, if you lead 1-on-1s, an occasional reminder when one is overdue. You can turn reminders off in Settings → Your account.</p>
      <h2>Record keeping and deletion</h2>
      <p>1-on-1 sessions are kept as organizational records. Only workspace owners and admins can delete a session, and each deletion is recorded in the activity log. Private notes belong to their author: only the author can read or delete them, and they leave no copy behind when deleted. When a workspace is deleted, all of its records are permanently removed.</p>
      <h2>Your choices</h2>
      <ul>
        <li><strong>Export:</strong> workspace owners and admins can download the workspace's data from Settings.</li>
        <li><strong>Delete:</strong> owners can permanently delete a workspace, and anyone can delete their own account from Settings.</li>
        <li><strong>Correct:</strong> you can edit your name and your own notes at any time.</li>
      </ul>
      <h2>Security</h2>
      <p>Data is encrypted in transit and access rules are enforced by the database on every request, not just on screen. Organizations with stricter requirements can run their own copy of Tandem.</p>
      <h2>We don't</h2>
      <ul>
        <li>Sell your data or use it for advertising.</li>
        <li>Use your content to train AI models.</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions or requests: <a className="text-accent underline" href={supportHref(DEFAULT_SUPPORT)}>{DEFAULT_SUPPORT}</a></p>
    </LegalPage>
  );
}
