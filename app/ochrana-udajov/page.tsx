import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ochrana osobných údajov' };

// Text čaká na kontrolu právnikom.
const OPERATOR = {
  name: 'Spark Link, s. r. o.',
  address: 'Lermontovova 911/3, 811 05 Bratislava – mestská časť Staré Mesto',
  ico: '55615597',
  dic: '2122032979',
  contact: 'info@granula.sk',
};

export default function PrivacyPage() {
  return (
    <article className="card prose">
      <h1>Ochrana <span className="hl">osobných údajov</span></h1>
      <p>
        Prevádzkovateľ analyzéra (značka Granula): <strong>{OPERATOR.name}</strong>, {OPERATOR.address},
        IČO {OPERATOR.ico}, DIČ {OPERATOR.dic}. Kontakt: <a href={`mailto:${OPERATOR.contact}`}>{OPERATOR.contact}</a>.
      </p>

      <h2>Aké údaje spracúvame a prečo</h2>
      <ul>
        <li>
          <strong>Text zloženia</strong>, ktorý vložíš alebo ktorý sa rozpozná z fotky, a výsledok analýzy. Ukladáme ich, aby
          fungoval trvalý odkaz na výsledok a aby sme mohli dopĺňať neznáme zložky. Neobsahujú osobné údaje.
        </li>
        <li>
          <strong>Fotka zloženia</strong> sa použije iba na prepis textu a neukladá sa. Na prepis využívame službu
          Claude od spoločnosti Anthropic, ktorej sa fotka odošle na spracovanie.
        </li>
        <li>
          <strong>E-mail a nepovinne meno psa</strong>, ak si vyžiadaš celý rozbor. Právny základ: vybavenie tvojej požiadavky
          (zaslanie rozboru). E-maily posielame cez službu Resend.
        </li>
        <li>
          <strong>Súhlas s marketingom</strong> je dobrovoľný a nie je podmienkou zaslania rozboru. Ukladáme presné znenie
          súhlasu a čas jeho udelenia. Súhlas môžeš kedykoľvek odvolať odkazom v e-maile alebo napísaním
          na {OPERATOR.contact}.
        </li>
        <li>
          <strong>Ochrana proti spamu:</strong> z IP adresy ukladáme iba jednosmerný odtlačok (nie samotnú adresu), najviac 24 hodín.
          Formuláre chráni služba Cloudflare Turnstile.
        </li>
      </ul>

      <h2>Ako dlho údaje uchovávame</h2>
      <p>
        E-mail uchovávame do odvolania súhlasu, najviac 3 roky od tvojej poslednej aktivity. Analýzy bez osobných údajov
        uchovávame, kým je analyzér v prevádzke.
      </p>

      <h2>Kde sú údaje uložené</h2>
      <p>Databáza beží v službe Supabase, web v službe Vercel. Údaje nepredávame ani neposkytujeme výrobcom krmív.</p>

      <h2>Tvoje práva</h2>
      <p>
        Máš právo na prístup k údajom, ich opravu, vymazanie, obmedzenie spracúvania, prenosnosť a právo namietať.
        Žiadosť pošli na {OPERATOR.contact}. Máš tiež právo podať sťažnosť Úradu na ochranu osobných údajov SR.
      </p>
    </article>
  );
}
