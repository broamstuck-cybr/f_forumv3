import { useId, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { IconSearch, IconShoppingBag } from "../../ui/icons";
import LunaNavbar from "./LunaNavbar";
import { LUNA_CATEGORIES, LUNA_LINKS, LUNA_NAV, LUNA_PRODUCTS, type LunaCategory, type LunaLink, type LunaProduct, } from "./luna-catalog";
import "./luna-hero.css";
const ease = [0.16, 1, 0.3, 1] as const;
export type LunaHeroProps = {
    theme?: "light" | "dark" | "system";
    links?: Partial<typeof LUNA_LINKS>;
    categories?: LunaCategory[];
    navLinks?: LunaLink[];
    products?: LunaProduct[];
    className?: string;
};
function Reveal({ children, delay = 0 }: {
    children: ReactNode;
    delay?: number;
}) {
    const reduced = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    return (<motion.div ref={ref} className="lh-reveal" initial={{ opacity: 0, y: 18, filter: "blur(6px)" }} animate={reduced ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.75, delay, ease }} onAnimationComplete={() => {
            if (ref.current)
                ref.current.style.filter = "";
        }}>
      {children}
    </motion.div>);
}
function Backdrop() {
    const reduced = useReducedMotion();
    return (<motion.div className="lh-backdrop" aria-hidden="true" initial={{ opacity: 0 }} animate={reduced ? undefined : { opacity: 1 }} transition={{ duration: 1.3, ease }}>
      <div className="lh-wash"/>
      <div className="lh-dots"/>
      <motion.div className="lh-pixels lh-pixels--left" initial={{ x: -28 }} animate={reduced ? undefined : { x: 0 }} transition={{ duration: 1.8, delay: 0.1, ease }}/>
      <motion.div className="lh-pixels lh-pixels--mobile" initial={{ x: -20 }} animate={reduced ? undefined : { x: 0 }} transition={{ duration: 1.8, delay: 0.15, ease }}/>
      <motion.div className="lh-pixels-wrap" initial={{ x: 28 }} animate={reduced ? undefined : { x: 0 }} transition={{ duration: 1.8, delay: 0.2, ease }}>
        <div className="lh-pixels lh-pixels--right"/>
      </motion.div>
      <div className="lh-vignette"/>
    </motion.div>);
}
function CategoryAction({ href }: {
    href: string;
}) {
    const reduced = useReducedMotion();
    const [focused, setFocused] = useState(false);
    return (<motion.div className="lh-category-action" initial="hidden" animate={focused || reduced ? "visible" : "hidden"} whileHover="visible" onFocusCapture={() => setFocused(true)} onBlurCapture={() => setFocused(false)}>
      <a className="lh-button lh-button--outline" href={href}>
        Khám phá danh mục
      </a>
      <motion.span className="lh-category-glyph" aria-hidden="true" variants={{ hidden: { opacity: 0, x: -24, scale: 0.72 }, visible: { opacity: 1, x: 0, scale: 1 } }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 30, mass: 0.7 }}>
        <IconSearch size={16} strokeWidth={2.4}/>
      </motion.span>
    </motion.div>);
}
export default function LunaHero({ theme = "system", links, categories = LUNA_CATEGORIES, navLinks = LUNA_NAV, products = LUNA_PRODUCTS, className = "", }: LunaHeroProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const routes = { ...LUNA_LINKS, ...links };
    return (<div ref={rootRef} className={`lh ${className}`} data-luna-theme={theme}>
      <LunaNavbar links={routes} categories={categories} navLinks={navLinks} products={products}/>
      <section className="lh-hero" aria-labelledby={titleId}>
        <Backdrop />
        <div className="lh-content">
          <div className="lh-copy">
            <Reveal>
              <h1 id={titleId}>
                Đồ số của bạn. <span>Một nơi duy nhất.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.08}>
              <p>
                Game, phần mềm, gói đăng ký, tài nguyên số và nhiều hơn nữa. Tìm thứ bạn cần, thanh toán an toàn và nhận sản phẩm ngay lập tức.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="lh-actions">
                <a className="lh-button" href={routes.store}>
                  <span className="lh-bag" aria-hidden="true">
                    <IconShoppingBag size={14} strokeWidth={2.4}/>
                  </span>
                  Xem sản phẩm
                </a>
                <CategoryAction href={routes.categories}/>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>);
}
export { LunaHero as LunaHero };
