import logoMark from "@/assets/logo-mark.png";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoMark} alt="Tandem" className="h-7 w-7 rounded-lg" />
            <span className="font-serif text-xl italic">Tandem</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
        <div className="mt-10 space-y-6 leading-relaxed text-foreground/85 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
          {children}
        </div>
      </main>
      <LegalFooter />
    </div>
  );
}

export function LegalFooter() {
  return (
    <footer className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6 border-t border-border px-6 py-6 text-xs text-muted-foreground">
      <Link to="/terms" className="hover:text-foreground">Terms of use</Link>
      <Link to="/privacy" className="hover:text-foreground">Privacy policy</Link>
      <Link to="/self-host" className="hover:text-foreground">Run it yourself</Link>
    </footer>
  );
}
