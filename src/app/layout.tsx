import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arbeidsark – norsk for voksenopplæring",
  description:
    "Lag unike arbeidsark og prøver i norsk for voksne innvandrere (A1–B2) med fasit og Word-eksport.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb">
      <body>
        <a className="skip-link" href="#main">
          Hopp til innhold
        </a>
        <header className="app-header">
          <div className="brand">
            <p className="brand-mark">Arbeidsark</p>
            <p className="brand-sub">
            Generator for øvingsark og prøver i norsk for voksenopplæring
            (A1–B2). Basert på læreplanen for voksne innvandrere.
          </p>
          </div>
        </header>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
