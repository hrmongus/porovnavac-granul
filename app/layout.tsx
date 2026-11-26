import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Analyzér zloženia granúl', template: '%s · Analyzér zloženia granúl' },
  description: 'Rozbor zloženia granúl pre psov podľa verejnej metodiky. Hodnotí iba zložky z textu zloženia, nie značky.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand">Analyzér zloženia granúl</Link>
            <nav aria-label="Hlavná navigácia">
              <Link href="/metodika">Metodika</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <p>
              <Link href="/metodika">Metodika</Link>
              <Link href="/ochrana-udajov">Ochrana osobných údajov</Link>
              <Link href="/nahlasit-chybu">Nahlásiť chybu</Link>
            </p>
            <p>Analyzér prevádzkuje Granula (granula.sk). Hodnotí iba text zloženia podľa rovnakých pravidiel pre všetky krmivá.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
