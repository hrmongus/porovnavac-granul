import Link from 'next/link';
import AnalyzerForm from './components/AnalyzerForm';

export default function Home() {
  return (
    <>
      <h1>Čo je v granulách vášho psa?</h1>
      <p className="lead">
        Odfoťte alebo vložte zloženie z obalu. Rozložíme ho na jednotlivé zložky, každú ohodnotíme a vysvetlíme.
        Hodnotíme iba text zloženia podľa <Link href="/metodika">verejnej metodiky</Link>, nie značku.
      </p>
      <AnalyzerForm />
    </>
  );
}
