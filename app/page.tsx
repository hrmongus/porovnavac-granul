import Link from 'next/link';
import AnalyzerForm from './components/AnalyzerForm';
import Star from './components/Star';

export default function Home() {
  return (
    <>
      <span className="tag lime">Podľa verejnej metodiky</span>
      <div className="title-row" style={{ marginTop: 18 }}>
        <h1>Čo je v granulách <span className="hl">tvojho psa?</span></h1>
        <Star />
      </div>
      <p className="lead">
        Odfoť alebo vlož zloženie z obalu. Rozložíme ho na jednotlivé zložky, každú ohodnotíme a vysvetlíme.
        Hodnotíme iba text zloženia podľa <Link href="/metodika">metodiky</Link>, nie značku.
      </p>
      <AnalyzerForm />
    </>
  );
}
