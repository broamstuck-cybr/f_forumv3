import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import logoUrl from "./assets/storybook-logo.svg";
import illustrationUrl from "./assets/storybook-illustration.webp";
import "./storybook-hero.css";
const NAV_LINKS = [
    { label: "Home", href: "#sbh-top", current: true },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "About Us", href: "#about" },
];
const HEADLINE = [
    ["Turn", "Your", "Ideas", "Into"],
    ["Something", "Magical"],
];
const STARS = [
    { x: 49.7, y: 22.6, s: 9, d: 0 },
    { x: 55.9, y: 19.6, s: 5, d: 1.4 },
    { x: 43.1, y: 29.0, s: 5, d: 2.3 },
    { x: 57.6, y: 36.3, s: 5, d: 0.8 },
    { x: 41.7, y: 43.2, s: 5, d: 3.1 },
    { x: 55.9, y: 45.3, s: 7, d: 1.9 },
    { x: 39.9, y: 53.5, s: 6, d: 2.7 },
];
function Arrow() {
    return (<svg className="sbh__arrow" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>);
}
export default function StorybookHero() {
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    useEffect(() => {
        if (!menuOpen)
            return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
        const onClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                setMenuOpen(false);
        };
        const mq = window.matchMedia("(min-width: 821px)");
        const onMq = () => mq.matches && setMenuOpen(false);
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onClick);
        mq.addEventListener("change", onMq);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onClick);
            mq.removeEventListener("change", onMq);
        };
    }, [menuOpen]);
    let wordIndex = 0;
    return (<section id="sbh-top" className={`sbh`} aria-labelledby="sbh-title">
      <div className="sbh__grain" aria-hidden="true"/>

      <header className="sbh__nav">
        <a href="#sbh-top" className="sbh__logo" aria-label="Home" onClick={(e) => e.preventDefault()}>
          
          <img src={logoUrl} alt="" width={31} height={28}/>
        </a>

        <div className="sbh__navRight" ref={menuRef}>
          <nav aria-label="Primary">
            <ul className="sbh__links">
              {NAV_LINKS.map((l) => (<li key={l.label}>
                  <a href={l.href} className="sbh__link" aria-current={l.current ? "page" : undefined}>
                    {l.label}
                  </a>
                </li>))}
            </ul>
          </nav>

          <a href="#start" className="sbh__btn sbh__btn--primary sbh__navCta">
            <span className="sbh__btnLabel">Start Creating</span>
            <Arrow />
          </a>

          <button type="button" className="sbh__menuBtn" aria-expanded={menuOpen} aria-controls="sbh-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((o) => !o)}>
            <span />
            <span />
          </button>

          <div id="sbh-menu" className="sbh__sheet" data-open={menuOpen} inert={!menuOpen}>
            <ul>
              {NAV_LINKS.map((l, i) => (<li key={l.label} style={{ "--i": i } as CSSProperties}>
                  <a href={l.href} onClick={() => setMenuOpen(false)}>
                    {l.label}
                  </a>
                </li>))}
            </ul>
            <a href="#start" className="sbh__btn sbh__btn--primary sbh__sheetCta" onClick={() => setMenuOpen(false)}>
              <span className="sbh__btnLabel">Start Creating</span>
              <Arrow />
            </a>
          </div>
        </div>
      </header>

      <div className="sbh__content">
        <h1 id="sbh-title" className="sbh__title">
          {HEADLINE.map((line, li) => (<span key={li} className="sbh__line">
              {line.map((word, wi) => {
                const i = wordIndex++;
                return (<Fragment key={word}>
                    <span className="sbh__word">
                      <span className="sbh__wordInner" style={{ "--i": i } as CSSProperties}>
                        {word}
                      </span>
                    </span>
                    {wi < line.length - 1 ? " " : null}
                  </Fragment>);
            })}
              {li < HEADLINE.length - 1 ? " " : null}
            </span>))}
        </h1>

        <p className="sbh__sub">
          Simplify your workflow, bring your ideas together, and turn them into measurable results in one calm
          workspace.
        </p>

        <div className="sbh__ctas">
          <a href="#start" className="sbh__btn sbh__btn--primary sbh__btn--lift">
            <span className="sbh__btnLabel">Start Creating</span>
            <Arrow />
          </a>
          <a href="#platform" className="sbh__btn sbh__btn--ghost">
            <span className="sbh__btnLabel">Explore The Platform</span>
          </a>
        </div>
      </div>

      <div className="sbh__stage" aria-hidden="true">
        <div className="sbh__art">
          <div className="sbh__artFloat">
            <div className="sbh__artGlow"/>
            
            <img className="sbh__artImg" src={illustrationUrl} alt="" width={930} height={1130} fetchPriority="high" decoding="async" draggable={false}/>
            <div className="sbh__windowGlow"/>
            {STARS.map((s, i) => (<span key={i} className="sbh__star" style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                "--size": `${s.s}%`,
                "--delay": `${s.d}s`,
            } as CSSProperties}/>))}
          </div>
        </div>
      </div>
    </section>);
}
export { StorybookHero as StorybookHero };
