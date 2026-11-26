import type { Metadata } from 'next';
import Link from 'next/link';
import { Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Analyzér zloženia granúl', template: '%s · Analyzér zloženia granúl' },
  description: 'Rozbor zloženia granúl pre psov podľa verejnej metodiky. Hodnotí iba zložky z textu zloženia, nie značky.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" className={montserrat.variable}>
      <body>
        <div className="topbar"><div className="wrap">Hodnotíme iba zložky, nie značky</div></div>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand" aria-label="Analyzér zloženia granúl – úvod">
              <span className="logo" aria-hidden="true">GRANULA!</span>
              <span className="brand-name">Analyzér<br />zloženia</span>
            </Link>
            <nav className="nav" aria-label="Hlavná navigácia">
              <Link href="/metodika">Metodika</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <p className="links">
              <Link href="/metodika">Metodika</Link>
              <Link href="/ochrana-udajov">Ochrana osobných údajov</Link>
              <Link href="/nahlasit-chybu">Nahlásiť chybu</Link>
            </p>
            <p>Analyzér prevádzkuje Granula (granula.sk). Hodnotí iba text zloženia podľa rovnakých pravidiel pre všetky krmivá vrátane našich.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
