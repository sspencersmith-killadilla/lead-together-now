import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tandem — free, open-source 1-on-1 coaching for every leader" },
      {
        name: "description",
        content:
          "Shared agendas, private notes, action items that follow through, and optional AI summaries. MIT-licensed and self-hostable.",
      },
      { property: "og:title", content: "Tandem — open-source 1-on-1 coaching" },
      {
        property: "og:description",
        content: "Better 1-on-1s for team leads, managers, executives, coordinators and captains. Free and open source.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  ["Shared agenda", "Both people add topics before you meet, so nothing important waits for next time."],
  ["Prompts that fit", "Weekly check-ins, career growth, first 90 days, skip-levels — or write your own."],
  ["Private when it matters", "Shared notes for both of you. Private notes only the leader can see."],
  ["Follow-through", "Action items carry from meeting to meeting until someone checks them off."],
  ["A growth timeline", "Look back over months of conversations and export them for reviews or reflection."],
  ["AI, if you want it", "Optional summaries and action-item suggestions. Turn it off and everything still works."],
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-serif text-xl">Tandem</span>
        <Link to="/auth" className="text-sm font-medium text-primary hover:underline">
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-20 md:py-28">
          <p className="text-sm uppercase tracking-widest text-highlight">Free · Open source · MIT</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
            The conversation that makes people better, kept in one quiet place.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Tandem helps leaders at every level — team leads, managers, executives, nonprofit coordinators, volunteer
            captains — run 1-on-1s that actually lead somewhere.
          </p>
          <Link
            to="/auth"
            className="mt-10 inline-flex rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
          >
            Start your first 1-on-1
          </Link>
        </section>

        <section className="grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-2">
          {features.map(([title, body]) => (
            <div key={title} className="bg-card p-8">
              <h2 className="text-xl">{title}</h2>
              <p className="mt-2 text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <section className="py-20">
          <h2 className="text-3xl">Yours to keep</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Tandem is released under the MIT license. Use the hosted version, or run it on your own servers with your
            own AI provider. Your notes belong to you and the person you're meeting with — not to HR, and not to us.
          </p>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Tandem · open-source 1-on-1 coaching
      </footer>
    </div>
  );
}
