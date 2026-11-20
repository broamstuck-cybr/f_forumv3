import { useEffect, useRef, useState } from "react";
import {
  AppWindow,
  ArrowRight,
  ChevronDown,
  Coins,
  Gamepad2,
  Gift,
  Menu,
  Palette,
  RefreshCw,
  Search as SearchGlyph,
  X,
} from "lucide-react";
import { LUNA_LINKS, type LunaCategory, type LunaLink, type LunaProduct } from "./luna-catalog";

const glyphs = {
  games: Gamepad2,
  software: AppWindow,
  subscriptions: RefreshCw,
  gifts: Gift,
  assets: Palette,
  topups: Coins,
};

type NavbarProps = {
  links: typeof LUNA_LINKS;
  categories: LunaCategory[];
  navLinks: LunaLink[];
  products: LunaProduct[];
};

function BrandMark() {
  return (
    <svg viewBox="0 0 56 40" aria-hidden="true" focusable="false" className="lh-brand-mark">
      <path d="M43 0C50.1797 6.44277e-07 56 5.8203 56 13C56 20.1797 50.1797 26 43 26H34.4844L48.4844 40H31.5156L15.7578 24.2422C14.672 23.1564 14 21.6569 14 20C14 16.6863 16.6863 14 20 14H43C43.5523 14 44 13.5523 44 13C44 12.4477 43.5523 12 43 12H20C15.5817 12 12 15.5817 12 20C12 22.3901 13.0482 24.5347 14.71 26H14.6875L28.6875 40H20C8.95431 40 0 31.0457 0 20C0 8.95431 8.9543 0 20 0H43Z" fill="currentColor" />
      <path d="M56 28V40H51.3125L39.3125 28H56Z" fill="currentColor" />
    </svg>
  );
}

function CategoryLink({ category, onClick }: { category: LunaCategory; onClick?: () => void }) {
  const Glyph = glyphs[category.icon];
  return (
    <a className="lh-category-link" href={category.href} onClick={onClick}>
      <Glyph size={22} aria-hidden="true" />
      <span>
        <strong>{category.label}</strong>
        <span>{category.description}</span>
      </span>
    </a>
  );
}

function CategoryMenu({ links, categories }: Pick<NavbarProps, "links" | "categories">) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="lh-menu-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="lh-nav-link"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        Danh mục
      </button>
      <span className="lh-caret" aria-hidden="true">
        <ChevronDown size={12} />
      </span>
      {open && (
        <div className="lh-positioner">
          <div className="lh-mega lh-glass lh-pop" role="menu">
            <div className="lh-mega-links">
              <p className="lh-menu-label">Mua sắm theo danh mục</p>
              <div className="lh-category-grid">
                {categories.map((category) => (
                  <CategoryLink key={category.href} category={category} onClick={close} />
                ))}
              </div>
              <a className="lh-all-categories" href={links.categories} onClick={close}>
                Xem toàn bộ danh mục <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <a className="lh-featured" href={links.store} onClick={close}>
              <div className="lh-featured-art" aria-hidden="true">
                <div className="lh-featured-pixels" />
                <span className="lh-featured-glyph">
                  <Gamepad2 size={44} />
                </span>
                <span className="lh-featured-caption">Game sẵn sàng để chơi</span>
              </div>
              <strong>
                Tựa game tiếp theo, giao ngay <ArrowRight size={16} aria-hidden="true" />
              </strong>
              <span>Duyệt sản phẩm số và kiểm tra khu vực áp dụng trước khi mua.</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Search({ links, categories, navLinks, products }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return;
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      setQuery("");
      setOpen((value) => !value);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const term = query.trim().toLowerCase();
  const groups = [
    {
      label: "Sản phẩm",
      items: products.map((p) => ({ ...p, search: `${p.label} ${p.region} ${p.keywords?.join(" ") ?? ""}` })),
    },
    {
      label: "Danh mục",
      items: categories.map((c) => ({ ...c, region: "", search: `${c.label} ${c.description}` })),
    },
    {
      label: "Trang",
      items: [
        { label: "Xem toàn bộ sản phẩm", href: links.store },
        ...navLinks,
        { label: "Đăng nhập", href: links.signIn },
        { label: "Tạo tài khoản", href: links.join },
      ].map((l) => ({ ...l, region: "", search: l.label })),
    },
  ].map((group) => ({
    ...group,
    items: group.items.filter((item) => !term || item.search.toLowerCase().includes(term)),
  }));
  const count = groups.reduce((total, group) => total + group.items.length, 0);

  return (
    <>
      <button
        type="button"
        className="lh-search-trigger lh-icon-button lh-glass"
        aria-label="Mở tìm kiếm"
        onClick={() => changeOpen(true)}
      >
        <SearchGlyph size={18} aria-hidden="true" />
      </button>
      {open && (
        <>
          <div className="lh-dialog-backdrop lh-fade" onClick={() => changeOpen(false)} />
          <div className="lh-search-dialog lh-pop" role="dialog" aria-modal="true" aria-label="Tìm kiếm Luna">
            <div className="lh-search-field">
              <SearchGlyph size={20} aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                aria-label="Tìm sản phẩm, danh mục và trang"
                placeholder="Tìm sản phẩm, danh mục và trang..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button type="button" className="lh-icon-button" aria-label="Đóng tìm kiếm" onClick={() => changeOpen(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="lh-search-results">
              <p className="lh-sr-only" role="status">
                {count} kết quả
              </p>
              {count === 0 ? (
                <p className="lh-search-empty">Không có kết quả. Thử tên sản phẩm hoặc danh mục khác.</p>
              ) : (
                groups.map((group) =>
                  group.items.length > 0 ? (
                    <div key={group.label}>
                      <p className="lh-menu-label">{group.label}</p>
                      {group.items.map((item) => (
                        <a key={item.href + item.label} href={item.href} className="lh-search-result" onClick={() => changeOpen(false)}>
                          <span>{item.label}</span>
                          {item.region && <span className="lh-region">{item.region}</span>}
                          <ArrowRight size={16} aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  ) : null,
                )
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MobileMenu({ links, categories, navLinks }: Omit<NavbarProps, "products">) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className="lh-menu-trigger lh-icon-button lh-glass"
        aria-label="Mở menu điều hướng"
        onClick={() => setOpen(true)}
      >
        <Menu size={22} aria-hidden="true" />
      </button>
      {open && (
        <>
          <div className="lh-dialog-backdrop lh-fade" onClick={close} />
          <div className="lh-mobile-menu lh-slide" role="dialog" aria-modal="true" aria-label="Menu Luna">
            <div className="lh-mobile-heading">
              <span>Luna</span>
              <button type="button" className="lh-icon-button" aria-label="Đóng menu điều hướng" onClick={close}>
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Điều hướng di động" className="lh-mobile-links">
              <p className="lh-menu-label">Danh mục</p>
              {categories.map((category) => (
                <CategoryLink key={category.href} category={category} onClick={close} />
              ))}
              <a className="lh-all-categories" href={links.categories} onClick={close}>
                Xem toàn bộ danh mục <ArrowRight size={16} aria-hidden="true" />
              </a>
              <div className="lh-mobile-pages">
                {navLinks.map((link) => (
                  <a className="lh-nav-link" key={link.href} href={link.href} onClick={close}>
                    {link.label}
                  </a>
                ))}
              </div>
            </nav>
            <div className="lh-mobile-footer">
              <a className="lh-button" href={links.signIn} onClick={close}>
                Đăng nhập
              </a>
              <a className="lh-button lh-button--outline" href={links.join} onClick={close}>
                Tạo tài khoản
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default function LunaNavbar(props: NavbarProps) {
  return (
    <header className="lh-header">
      <div className="lh-navbar">
        <a className="lh-brand" href={props.links.home} aria-label="Luna trang chủ">
          <BrandMark />
          <span>Luna</span>
        </a>
        <nav className="lh-desktop-nav lh-glass" aria-label="Điều hướng chính">
          <CategoryMenu links={props.links} categories={props.categories} />
          {props.navLinks.map((link) => (
            <a key={link.href} className="lh-nav-link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="lh-nav-actions">
          <Search {...props} />
          <a className="lh-button lh-sign-in" href={props.links.signIn}>
            Đăng nhập
          </a>
          <MobileMenu links={props.links} categories={props.categories} navLinks={props.navLinks} />
        </div>
      </div>
    </header>
  );
}
