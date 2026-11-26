import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ochrana osobných údajov' };

// [DOPLNIŤ] – údaje o prevádzkovateľovi musí doplniť a schváliť prevádzkovateľ (ideálne s právnikom).
const OPERATOR = {
  name: '[DOPLNIŤ: obchodné meno prevádzkovateľa Granula]',
  address: '[DOPLNIŤ: sídlo]',
  ico: '[DOPLNIŤ: IČO]',
  contact: '[DOPLNIŤ: kontaktný e-mail]',
};

export default function PrivacyPage() {
  return (
    <article className="card prose">
      <h1>Ochrana osobných údajov</h1>
      <p>
        Prevádzkovateľ: {OPERATOR.name}, {OPERATOR.address}, IČO {OPERATOR.ico}. Kontakt: {OPERATOR.contact}.
      </p>

      <h2>Aké údaje spracúvame a prečo</h2>
      <ul>
        <li>
          <strong>Text zloženia</strong>, ktorý vložíte alebo ktorý sa rozpozná z fotky, a výsledok analýzy. Ukladáme ich, aby
          fungoval trvalý odkaz na výsledok a aby sme mohli dopĺňať neznáme zložky. Neobsahujú osobné údaje.
        </li>
        <li>
          <strong>Fotka zloženia</strong> sa použije iba na prepis textu a neukladá sa. Na prepis využívame službu
          Claude (Anthropic), ktorej sa fotka odošle na spracovanie.
        </li>
        <li>
          <strong>E-mail a nepovinne meno psa</strong>, ak si vyžiadate celý rozbor. Právny základ: plnenie vašej požiadavky
          (zaslanie rozboru). E-mail na zaslanie rozboru posielame cez službu Resend.
        </li>
        <li>
          <strong>Súhlas s marketingom</strong> je dobrovoľný a nie je podmienkou zaslania rozboru. Ukladáme presné znenie
          súhlasu a čas jeho udelenia. Súhlas môžete kedykoľvek odvolať odkazom v e-maile alebo napísaním na {OPERATOR.contact}.
        </li>
        <li>
          <strong>Ochrana proti spamu:</strong> z IP adresy ukladáme iba jednosmerný odtlačok (nie samotnú adresu), najviac 24 hodín.
          Formuláre chráni služba Cloudflare Turnstile.
        </li>
      </ul>

      <h2>Ako dlho údaje uchovávame</h2>
      <p>
        E-mail na zaslanie rozboru uchovávame [DOPLNIŤ: napr. 2 roky]. Pri súhlase s marketingom do jeho odvolania.
        Analýzy bez osobných údajov uchovávame, kým je analyzér v prevádzke.
      </p>

      <h2>Kde sú údaje uložené</h2>
      <p>Databáza beží v službe Supabase, web v službe Vercel. Údaje nepredávame ani neposkytujeme výrobcom krmív.</p>

      <h2>Vaše práva</h2>
      <p>
        Máte právo na prístup k údajom, ich opravu, vymazanie, obmedzenie spracúvania, prenosnosť a právo namietať.
        Žiadosť pošlite na {OPERATOR.contact}. Máte tiež právo podať sťažnosť Úradu na ochranu osobných údajov SR.
      </p>
    </article>
  );
}
