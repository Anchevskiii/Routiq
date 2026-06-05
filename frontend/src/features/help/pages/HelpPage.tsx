import React, { useState, useRef } from 'react'
import './HelpPage.css'
import { filterFaq, countForCat } from './faq.utils'
import type { FaqCat, FaqItem } from './faq.utils'

const FAQ: FaqItem[] = [
  { id: 1, cat: 'gen',     color: '#6366f1', q: 'Kako dolgo traja generiranje načrta?',          keywords: 'generiranje čas',           a: 'Običajno med <strong>20 in 60 sekundami</strong> — čas je odvisen od števila dni in kompleksnosti potovanja. Med čakanjem ti pokažemo zanimivosti o destinaciji.' },
  { id: 2, cat: 'gen',     color: '#6366f1', q: 'Koliko dni itinerarja lahko generiram?',         keywords: 'generiranje dnevi',          a: 'En itinerar lahko obsega <strong>do 14 dni</strong>. Za daljša potovanja preprosto ustvariš več povezanih načrtov.' },
  { id: 3, cat: 'gen',     color: '#6366f1', q: 'Ali lahko znova generiram itinerar?',            keywords: 'generiranje regeneriram',    a: 'Da. Kadarkoli odpreš <strong>planer obrazec</strong>, prilagodiš želje in Routiq ustvari povsem nov predlog poti.' },
  { id: 4, cat: 'edit',    color: '#8b5cf6', q: 'Ali lahko dodam ali odstranim aktivnosti?',     keywords: 'urejanje dodam odstranim',  a: 'Seveda. Aktivnosti urejaš z <strong>drag &amp; drop</strong> — premikaj jih med dnevi, dodajaj nove ali odstranjuj obstoječe.' },
  { id: 5, cat: 'edit',    color: '#8b5cf6', q: 'Ali se spremembe samodejno shranijo?',          keywords: 'urejanje shranjevanje',      a: 'Da, vse spremembe se <strong>shranijo avtomatsko</strong> in sproti, tako da nikoli ne izgubiš svojega dela.' },
  { id: 6, cat: 'groups',  color: '#a855f7', q: 'Kako povabim nekoga v skupino?',                keywords: 'skupina povabi',             a: 'V potovanju izbereš »Povabi« in pošlješ <strong>e-poštno povabilo</strong>. Povabljenec se pridruži z enim klikom.' },
  { id: 7, cat: 'groups',  color: '#a855f7', q: 'Kako deluje glasovanje?',                       keywords: 'skupina glasovanje upvote',  a: 'Vsak član lahko da <strong>upvote ali downvote</strong> posameznim itinerarjem. Skupni rezultat (score) je enak številu upvotov — najboljša ideja zmaga.' },
  { id: 8, cat: 'groups',  color: '#a855f7', q: 'Ali mora imeti povabljenec račun?',             keywords: 'skupina registracija račun', a: 'Da — za sodelovanje, glasovanje in klepet mora vsak član imeti <strong>svoj Routiq račun</strong>. Registracija je brezplačna.' },
  { id: 9, cat: 'export',  color: '#ec4899', q: 'Kateri formati izvoza so podprti?',             keywords: 'izvoz pdf ics format',       a: 'Podpiramo <strong>PDF</strong> za tiskanje in deljenje ter <strong>.ics</strong> datoteke za Google in Apple Calendar.' },
  { id: 10, cat: 'export', color: '#ec4899', q: 'Ali je izvoz brezplačen?',                      keywords: 'izvoz brezplačen cena',      a: 'Da, izvoz v PDF in koledar je <strong>popolnoma brezplačen</strong> in brez omejitev.' },
  { id: 11, cat: 'account', color: '#f59e0b', q: 'Kako spremenim geslo?',                        keywords: 'račun geslo',                a: 'Odpri <strong>Nastavitve → Varnost → Spremeni geslo</strong>. Po potrditvi trenutnega gesla vnešeš novega.' },
  { id: 12, cat: 'account', color: '#f59e0b', q: 'Kako izbrišem svoj račun?',                    keywords: 'račun izbriši',              a: 'V <strong>Nastavitve → Račun → Izbriši račun</strong>. Dejanje je trajno in odstrani vse tvoje načrte ter podatke.' },
]

const TABS: { id: FaqCat; label: string }[] = [
  { id: 'all',     label: 'Vse' },
  { id: 'gen',     label: 'Generiranje' },
  { id: 'edit',    label: 'Urejanje' },
  { id: 'groups',  label: 'Skupine' },
  { id: 'export',  label: 'Izvoz' },
  { id: 'account', label: 'Račun' },
]

const CHIPS = ['Generiranje', 'Izvoz v PDF', 'Povabi skupino', 'Glasovanje']

export const HelpPage: React.FC = () => {
  const [openId, setOpenId] = useState<number | null>(null)
  const [cat, setCat] = useState<FaqCat>('all')
  const [query, setQuery] = useState('')
  const faqRef = useRef<HTMLDivElement>(null)

  const visible = filterFaq(FAQ, cat, query)

  function goFaq() {
    faqRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function setChip(text: string) {
    setQuery(text)
    setCat('all')
    setTimeout(goFaq, 50)
  }

  function countFor(id: FaqCat) { return countForCat(FAQ, id) }

  return (
    <div>
      {/* Hero */}
      <div className="hp-hero">
        <div className="hp-hero-stars" />
        <div className="hp-hero-glow hp-hero-glow-1" />
        <div className="hp-hero-glow hp-hero-glow-2" />
        <div className="hp-hero-inner">
          <span className="hp-eyebrow">
            <span className="hp-spark">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v4M12 17v4M5 12H3M21 12h-2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </span>
            CENTER ZA POMOČ
          </span>
          <h1 className="hp-hero-title">Kako ti lahko <span className="hp-em">pomagamo?</span></h1>
          <p className="hp-hero-sub">Poišči odgovore, spoznaj funkcije ali nas kontaktiraj — da bo tvoje naslednje potovanje brezskrbno.</p>
          <div className="hp-search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
            </svg>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setCat('all') }}
              placeholder="Išči po pogostih vprašanjih…"
              autoComplete="off"
            />
            <button className="hp-search-btn" type="button" onClick={goFaq}>Išči</button>
          </div>
          <div className="hp-chips">
            <span className="hp-chip-label">Priljubljeno:</span>
            {CHIPS.map(c => (
              <button key={c} className="hp-chip" type="button" onClick={() => setChip(c)}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="hp-wrap">
        {/* Steps */}
        <section className="hp-section" id="help-start">
          <div className="hp-section-head">
            <span className="hp-kicker">PRVI KORAKI</span>
            <h2 className="hp-section-title">Od ideje do načrta v štirih korakih</h2>
            <p className="hp-section-desc">Ustvari prvo potovanje v nekaj minutah — brez izkušenj z načrtovanjem.</p>
          </div>
          <div className="hp-steps">
            <div className="hp-step">
              <span className="hp-step-num">01</span>
              <div className="hp-step-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6 1.3 0 2.6.4 3.6 1.1"/><path d="M17 11v6M14 14h6"/>
                </svg>
              </div>
              <h3 className="hp-step-title">Ustvari račun</h3>
              <p className="hp-step-desc">Registriraj se v nekaj sekundah — z e-pošto ali Google računom.</p>
            </div>
            <div className="hp-step">
              <span className="hp-step-num">02</span>
              <div className="hp-step-icon" style={{ background: 'linear-gradient(135deg,#8b5cf6,#a855f7)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 18h0"/>
                  <circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>
                </svg>
              </div>
              <h3 className="hp-step-title">Vnesi potovanje</h3>
              <p className="hp-step-desc">Povej nam destinacijo, datume in tip potovanja, ki ga želiš.</p>
            </div>
            <div className="hp-step">
              <span className="hp-step-num">03</span>
              <div className="hp-step-icon" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8l1.4 1.4M17.8 6.2l1.4-1.4M3 21l9-9"/><path d="M12.5 7.5l4 4"/>
                </svg>
              </div>
              <h3 className="hp-step-title">AI ustvari načrt</h3>
              <p className="hp-step-desc">Routiq v nekaj sekundah sestavi tvoj popoln itinerar po dnevih.</p>
            </div>
            <div className="hp-step">
              <span className="hp-step-num">04</span>
              <div className="hp-step-icon" style={{ background: 'linear-gradient(135deg,#ec4899,#f59e0b)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>
                </svg>
              </div>
              <h3 className="hp-step-title">Uredi &amp; deli</h3>
              <p className="hp-step-desc">Prilagodi, povabi sopotnike ter izvozi v PDF ali koledar.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="hp-section" id="help-faq" ref={faqRef}>
          <div className="hp-section-head">
            <span className="hp-kicker">POGOSTA VPRAŠANJA</span>
            <h2 className="hp-section-title">Vse, kar te zanima</h2>
            <p className="hp-section-desc">
              {query ? <>Rezultati za »<strong>{query}</strong>«</> : 'Izberi kategorijo ali poišči svoje vprašanje.'}
            </p>
          </div>

          {!query && (
            <div className="hp-faq-tabs">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`hp-faq-tab${cat === t.id ? ' hp-active' : ''}`}
                  onClick={() => { setCat(t.id); setQuery('') }}
                >
                  {t.label} <span className="hp-count">{countFor(t.id)}</span>
                </button>
              ))}
            </div>
          )}

          {visible.length > 0 ? (
            <div className="hp-faq-list">
              {visible.map(item => (
                <div key={item.id} className={`hp-faq-item${openId === item.id ? ' hp-open' : ''}`}>
                  <button className="hp-faq-q" type="button" onClick={() => setOpenId(openId === item.id ? null : item.id)}>
                    <span className="hp-cat-dot" style={{ background: item.color }} />
                    <span className="hp-faq-q-text">{item.q}</span>
                    <span className="hp-chevron">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </span>
                  </button>
                  <div className="hp-faq-body">
                    <div className="hp-faq-body-inner">
                      <p className="hp-faq-a" dangerouslySetInnerHTML={{ __html: item.a }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="hp-faq-empty">
              Za »<strong>{query}</strong>« nismo našli odgovora. Poskusi drugo iskanje ali nas{' '}
              <a href="#help-contact" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>kontaktiraj</a>.
            </div>
          )}
        </section>

        {/* Features */}
        <section className="hp-section" id="help-features">
          <div className="hp-section-head">
            <span className="hp-kicker">FUNKCIJE</span>
            <h2 className="hp-section-title">Vse na enem mestu</h2>
            <p className="hp-section-desc">Orodja, ki tvoje načrtovanje spremenijo v užitek.</p>
          </div>
          <div className="hp-features">
            {[
              { grad: 'linear-gradient(135deg,#6366f1,#818cf8)', title: 'AI generiranje',        desc: 'Popoln itinerar po dnevih v nekaj sekundah.',          icon: <><path d="M12 3v4M12 17v4M5 12H3M21 12h-2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"/><circle cx="12" cy="12" r="3"/></> },
              { grad: 'linear-gradient(135deg,#3b82f6,#6366f1)',  title: 'Interaktivni zemljevid', desc: 'Vse postanke vidiš na živem zemljevidu.',              icon: <><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></> },
              { grad: 'linear-gradient(135deg,#8b5cf6,#a855f7)', title: 'Skupinska potovanja',  desc: 'Načrtuj skupaj s sopotniki v realnem času.',             icon: <><circle cx="9" cy="9" r="3.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="8" r="2.5"/><path d="M15 19c0-2 2-4 4.5-4"/></> },
              { grad: 'linear-gradient(135deg,#a855f7,#ec4899)', title: 'Glasovanje',            desc: 'Skupina glasuje o najboljših idejah.',                  icon: <><path d="M7 11v8H4a1 1 0 01-1-1v-6a1 1 0 011-1h3z"/><path d="M7 11l4-7a2 2 0 012 2v3h5a2 2 0 012 2.3l-1.2 6A2 2 0 0118.8 19H7"/></> },
              { grad: 'linear-gradient(135deg,#ec4899,#f472b6)', title: 'Klepet',                desc: 'Pogovori se s skupino kar v aplikaciji.',               icon: <><path d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z"/></> },
              { grad: 'linear-gradient(135deg,#f59e0b,#ec4899)', title: 'Izvoz PDF / ICS',       desc: 'Odnesi načrt v PDF ali svoj koledar.',                  icon: <><path d="M12 3v12M7 11l5 4 5-4"/><path d="M5 21h14"/></> },
              { grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)', title: 'Temni način',           desc: 'Prijazno do oči, podnevi in ponoči.',                   icon: <><path d="M20 14a8 8 0 11-9.5-9.8 6.5 6.5 0 009.5 9.8z"/></> },
              { grad: 'linear-gradient(135deg,#22c55e,#3b82f6)', title: 'Pametna časovnica',     desc: 'Optimiziran vrstni red postankov in razdalj.',          icon: <><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></> },
            ].map(f => (
              <div key={f.title} className="hp-feature">
                <div className="hp-feature-icon" style={{ background: f.grad, color: '#fff' }}>
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="hp-feature-title">{f.title}</h3>
                <p className="hp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="help-contact">
          <div className="hp-contact">
            <div className="hp-contact-stars" />
            <div className="hp-contact-l">
              <div className="hp-contact-eyebrow">ŠE VEDNO POTREBUJEŠ POMOČ?</div>
              <h2 className="hp-contact-title">Naša ekipa ti z veseljem pomaga</h2>
              <p className="hp-contact-sub">Nisi našel odgovora? Piši nam in odgovorili ti bomo v najkrajšem možnem času — običajno v enem delovnem dnevu.</p>
              <div className="hp-contact-actions">
                <a className="hp-contact-btn" href="mailto:routiqtravel@proton.me">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
                  </svg>
                  Pošlji sporočilo
                </a>
                <a className="hp-contact-mail" href="mailto:routiqtravel@proton.me">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
                  </svg>
                  routiqtravel@proton.me
                </a>
              </div>
            </div>
            <div className="hp-contact-r">
              <div className="hp-contact-badge">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#c4b5fd' }}>
                  <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/>
                  <path d="M5.6 5.6l3.2 3.2M15.2 15.2l3.2 3.2M18.4 5.6l-3.2 3.2M8.8 15.2l-3.2 3.2"/>
                </svg>
              </div>
            </div>
          </div>
        </section>

        <div className="hp-pb" />
      </div>
    </div>
  )
}
