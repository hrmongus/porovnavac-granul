import Link from 'next/link';
import Wizard from './components/Wizard';
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
        Vyber granule, odpovedz na pár otázok o psovi a dozvieš sa, či je to dobré jedlo, či sedí tvojmu psovi a koľko mu dávať.
        Hodnotíme iba zloženie podľa <Link href="/metodika">verejnej metodiky</Link>, rovnako pre všetky značky.
      </p>
      <Wizard />
    </>
  );
}
