import React, { useState, useRef } from 'react'
import './HelpPage.css'
import { filterFaq, countForCat } from './faq.utils'
import type { FaqCat, FaqItem } from './faq.utils'

const FAQ: FaqItem[] = [
  { id: 1,  cat: 'gen',     color: '#6366f1', q: 'How long does itinerary generation take?',       keywords: 'generation time duration',         a: 'Usually between <strong>20 and 60 seconds</strong> — the time depends on the number of days and trip complexity. While you wait, we show you interesting facts about your destination.' },
  { id: 2,  cat: 'gen',     color: '#6366f1', q: 'How many days can I generate an itinerary for?', keywords: 'generation days length',            a: 'A single itinerary can cover <strong>up to 14 days</strong>. For longer trips, simply create multiple connected plans.' },
  { id: 3,  cat: 'gen',     color: '#6366f1', q: 'Can I regenerate my itinerary?',                 keywords: 'generation regenerate redo',        a: 'Yes. Any time you open the <strong>planner form</strong>, adjust your preferences and Routiq will create a brand-new route proposal.' },
  { id: 4,  cat: 'edit',    color: '#8b5cf6', q: 'Can I add or remove activities?',                keywords: 'edit add remove activities',        a: 'Absolutely. Activities are managed with <strong>drag &amp; drop</strong> — move them between days, add new ones, or remove existing ones.' },
  { id: 5,  cat: 'edit',    color: '#8b5cf6', q: 'Are changes saved automatically?',               keywords: 'edit save autosave',               a: 'Yes, all changes are <strong>saved automatically</strong> in real time, so you never lose your work.' },
  { id: 6,  cat: 'groups',  color: '#a855f7', q: 'How do I invite someone to a group?',            keywords: 'group invite member',              a: 'In your trip, select <strong>Invite</strong> and send an email invitation. The invitee joins with a single click.' },
  { id: 7,  cat: 'groups',  color: '#a855f7', q: 'How does voting work?',                          keywords: 'group voting upvote downvote',      a: 'Each member can <strong>upvote or downvote</strong> individual itineraries. The total score equals the number of upvotes — the best idea wins.' },
  { id: 8,  cat: 'groups',  color: '#a855f7', q: 'Does an invitee need an account?',               keywords: 'group registration account signup', a: 'Yes — to collaborate, vote and chat, every member needs their own <strong>Routiq account</strong>. Registration is free.' },
  { id: 9,  cat: 'export',  color: '#ec4899', q: 'Which export formats are supported?',            keywords: 'export pdf ics format',            a: 'We support <strong>PDF</strong> for printing and sharing, and <strong>.ics</strong> files for Google and Apple Calendar.' },
  { id: 10, cat: 'export',  color: '#ec4899', q: 'Is exporting free?',                             keywords: 'export free cost price',           a: 'Yes, exporting to PDF and calendar is <strong>completely free</strong> and unlimited.' },
  { id: 11, cat: 'account', color: '#f59e0b', q: 'How do I change my password?',                   keywords: 'account password change',          a: 'Go to <strong>Settings → Security → Change password</strong>. After confirming your current password, enter the new one.' },
  { id: 12, cat: 'account', color: '#f59e0b', q: 'How do I delete my account?',                    keywords: 'account delete remove',            a: 'Go to <strong>Settings → Account → Delete account</strong>. This action is permanent and removes all your plans and data.' },
]

const TABS: { id: FaqCat; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'gen',     label: 'Generation' },
  { id: 'edit',    label: 'Editing' },
  { id: 'groups',  label: 'Groups' },
  { id: 'export',  label: 'Export' },
  { id: 'account', label: 'Account' },
]

const CHIPS = ['Generation', 'Export to PDF', 'Invite group', 'Voting']

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
            </span>{' '}
            HELP CENTER
          </span>
          <h1 className="hp-hero-title">How can we <span className="hp-em">help you?</span></h1>
          <p className="hp-hero-sub">Find answers, explore features or contact us — so your next trip is worry-free.</p>
          <div className="hp-search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
            </svg>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setCat('all') }}
              placeholder="Search frequently asked questions…"
              autoComplete="off"
            />
            <button className="hp-search-btn" type="button" onClick={goFaq}>Search</button>
          </div>
          <div className="hp-chips">
            <span className="hp-chip-label">Popular:</span>
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
            <span className="hp-kicker">GETTING STARTED</span>
            <h2 className="hp-section-title">From idea to itinerary in four steps</h2>
            <p className="hp-section-desc">Plan your first trip in minutes — no planning experience required.</p>
          </div>
          <div className="hp-steps">
            <div className="hp-step">
              <span className="hp-step-num">01</span>
              <div className="hp-step-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6 1.3 0 2.6.4 3.6 1.1"/><path d="M17 11v6M14 14h6"/>
                </svg>
              </div>
              <h3 className="hp-step-title">Create an account</h3>
              <p className="hp-step-desc">Sign up in seconds — with email or your Google account.</p>
            </div>
            <div className="hp-step">
              <span className="hp-step-num">02</span>
              <div className="hp-step-icon" style={{ background: 'linear-gradient(135deg,#8b5cf6,#a855f7)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 18h0"/>
                  <circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>
                </svg>
              </div>
              <h3 className="hp-step-title">Enter your trip</h3>
              <p className="hp-step-desc">Tell us your destination, dates and the type of trip you want.</p>
            </div>
            <div className="hp-step">
              <span className="hp-step-num">03</span>
              <div className="hp-step-icon" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8l1.4 1.4M17.8 6.2l1.4-1.4M3 21l9-9"/><path d="M12.5 7.5l4 4"/>
                </svg>
              </div>
              <h3 className="hp-step-title">AI builds your plan</h3>
              <p className="hp-step-desc">Routiq assembles a complete day-by-day itinerary in seconds.</p>
            </div>
            <div className="hp-step">
              <span className="hp-step-num">04</span>
              <div className="hp-step-icon" style={{ background: 'linear-gradient(135deg,#ec4899,#f59e0b)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>
                </svg>
              </div>
              <h3 className="hp-step-title">Edit &amp; share</h3>
              <p className="hp-step-desc">Customise, invite travel companions and export to PDF or calendar.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="hp-section" id="help-faq" ref={faqRef}>
          <div className="hp-section-head">
            <span className="hp-kicker">FREQUENTLY ASKED QUESTIONS</span>
            <h2 className="hp-section-title">Everything you need to know</h2>
            <p className="hp-section-desc">
              {query ? <>Results for »<strong>{query}</strong>«</> : 'Pick a category or search for your question.'}
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
              No results for »<strong>{query}</strong>«. Try a different search or{' '}
              <a href="#help-contact" style={{ color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>contact us</a>.
            </div>
          )}
        </section>

        {/* Features */}
        <section className="hp-section" id="help-features">
          <div className="hp-section-head">
            <span className="hp-kicker">FEATURES</span>
            <h2 className="hp-section-title">Everything in one place</h2>
            <p className="hp-section-desc">Tools that turn trip planning into a pleasure.</p>
          </div>
          <div className="hp-features">
            {[
              { grad: 'linear-gradient(135deg,#6366f1,#818cf8)', title: 'AI generation',       desc: 'A complete day-by-day itinerary in seconds.',           icon: <><path d="M12 3v4M12 17v4M5 12H3M21 12h-2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"/><circle cx="12" cy="12" r="3"/></> },
              { grad: 'linear-gradient(135deg,#3b82f6,#6366f1)',  title: 'Interactive map',    desc: 'Every stop visible on a live map.',                     icon: <><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></> },
              { grad: 'linear-gradient(135deg,#8b5cf6,#a855f7)', title: 'Group trips',         desc: 'Plan together with travel companions in real time.',    icon: <><circle cx="9" cy="9" r="3.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="8" r="2.5"/><path d="M15 19c0-2 2-4 4.5-4"/></> },
              { grad: 'linear-gradient(135deg,#a855f7,#ec4899)', title: 'Voting',               desc: 'Your group votes on the best ideas.',                   icon: <><path d="M7 11v8H4a1 1 0 01-1-1v-6a1 1 0 011-1h3z"/><path d="M7 11l4-7a2 2 0 012 2v3h5a2 2 0 012 2.3l-1.2 6A2 2 0 0118.8 19H7"/></> },
              { grad: 'linear-gradient(135deg,#ec4899,#f472b6)', title: 'Chat',                 desc: 'Talk to your group directly inside the app.',           icon: <path d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z"/> },
              { grad: 'linear-gradient(135deg,#f59e0b,#ec4899)', title: 'PDF / ICS export',    desc: 'Take your plan as a PDF or add it to your calendar.',   icon: <><path d="M12 3v12M7 11l5 4 5-4"/><path d="M5 21h14"/></> },
              { grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)', title: 'Dark mode',            desc: 'Easy on the eyes, day and night.',                     icon: <path d="M20 14a8 8 0 11-9.5-9.8 6.5 6.5 0 009.5 9.8z"/> },
              { grad: 'linear-gradient(135deg,#22c55e,#3b82f6)', title: 'Smart timeline',       desc: 'Optimised order of stops and travel distances.',        icon: <><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></> },
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
              <div className="hp-contact-eyebrow">STILL NEED HELP?</div>
              <h2 className="hp-contact-title">Our team is happy to help</h2>
              <p className="hp-contact-sub">Didn't find your answer? Write to us and we'll get back to you as soon as possible — usually within one business day.</p>
              <div className="hp-contact-actions">
                <a className="hp-contact-btn" href="mailto:routiqtravel@proton.me">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>
                  </svg>
                  Send a message
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
