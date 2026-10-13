import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { DEFAULT_SUPPORT, supportHref } from "@/lib/site";

const title = "Terms of use — Tandem";
const description = "The plain-language terms for using Tandem, the open-source 1-on-1 coaching app.";

export const Route = createFileRoute("/terms")({
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
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms of use" updated="October 5, 2026">
      <p>These terms cover your use of this Tandem site. Tandem is free, open-source software under the MIT license. Organizations that run their own copy set their own terms.</p>
      <h2>Your account</h2>
      <ul>
        <li>Give accurate sign-up details and keep your password private.</li>
        <li>You're responsible for what happens under your account.</li>
        <li>You can delete your account at any time from Settings → Your account.</li>
      </ul>
      <h2>Your content</h2>
      <ul>
        <li>Notes, agendas, action items and templates you add stay yours. We don't sell them or use them for advertising.</li>
        <li>Workspace owners and admins manage people and templates for their workspace, but can't read anyone's 1-on-1 notes.</li>
        <li>Only add information you're allowed to share. Follow your organization's policies on what belongs in a 1-on-1 record.</li>
      </ul>
      <h2>Record keeping</h2>
      <p>1-on-1 sessions are organizational records. Only workspace owners and admins can delete a session, and every deletion is recorded in the workspace's activity log. This supports records-retention obligations, including those that apply to public-sector organizations. Private notes are personal working notes: only their author can read or delete them, and they are not part of the organizational record.</p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Don't use Tandem to harass anyone, break the law, or try to access data that isn't yours.</li>
        <li>Don't try to overload or disrupt the service. AI features have hourly limits.</li>
      </ul>
      <h2>AI features</h2>
      <p>Optional AI summaries and suggestions read only shared content, never private notes. AI output can be wrong; check it before relying on it. Admins can turn AI off for their workspace.</p>
      <h2>No warranty</h2>
      <p>Tandem is provided "as is", without warranty of any kind. To the extent the law allows, the people who run this site aren't liable for indirect or consequential losses from using it. Keep your own copies of anything critical using the export in Settings.</p>
      <h2>Changes</h2>
      <p>We may update these terms. The date at the top shows the latest version. Continuing to use Tandem after a change means you accept the update.</p>
      <h2>Contact</h2>
      <p>Questions? <a className="text-accent underline" href={supportHref(DEFAULT_SUPPORT)}>{DEFAULT_SUPPORT}</a></p>
    </LegalPage>
  );
}
