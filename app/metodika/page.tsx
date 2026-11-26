import type { Metadata } from 'next';
import { readFile } from 'fs/promises';
import path from 'path';
import { marked } from 'marked';

export const metadata: Metadata = { title: 'Metodika hodnotenia' };

export default async function MetodikaPage() {
  const md = await readFile(path.join(process.cwd(), 'docs', 'METODIKA.md'), 'utf8');
  const html = await marked.parse(md);
  // Obsah pochádza z repozitára (docs/METODIKA.md), nie od používateľov.
  return <article className="card prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
