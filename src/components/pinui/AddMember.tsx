import type React from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { animate, stagger } from "motion/react";
import "./add-member.css";
export type MemberStatus = "online" | "idle" | "dnd" | "offline";
export type Member = {
    name: string;
    role: string;
    img: string;
    status: MemberStatus;
    ring?: boolean;
};
export type AddMemberProps = {
    corner?: number;
    rows?: 2 | 3 | 4 | "2" | "3" | "4";
    theme?: "light" | "dark";
    open?: boolean;
    members?: Member[];
    onAdd?: (names: string[]) => void;
    search?: boolean;
};
const EASE = [0.22, 1, 0.36, 1] as const;
const OUT = { duration: 0.42, ease: EASE };
const QUICK = { duration: 0.22, ease: EASE };
const SPRING = { type: "spring", stiffness: 320, damping: 30, mass: 0.9 } as const;
const SNAP = { type: "spring", stiffness: 650, damping: 24, mass: 0.6 } as const;
const MAX_CHIPS = 4;
const settle = (anim: {
    then: (resolve: () => void) => unknown;
}, ms: number) => Promise.race([
    new Promise<void>((resolve) => {
        anim.then(resolve);
    }),
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
]);
function commit(el: HTMLElement | SVGElement | null | undefined, styles: Partial<CSSStyleDeclaration>) {
    if (el)
        Object.assign(el.style, styles);
}
const avatarUri = (name: string, hue: number) => {
    const initials = name.split(" ").slice(-2).map((w) => w[0]).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="hsl(${hue} 34% 42%)"/><circle cx="48" cy="38" r="17" fill="hsl(${hue} 40% 78%)"/><path d="M14 96c2-22 16-34 34-34s32 12 34 34z" fill="hsl(${hue} 40% 78%)"/><text x="48" y="88" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="700" fill="hsl(${hue} 34% 22%)">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
const DEFAULT_MEMBERS: Member[] = [
    { name: "Nguyễn Minh Anh", role: "Chuyên viên giao diện", img: avatarUri("Nguyễn Minh Anh", 12), status: "online" },
    { name: "Trần Gia Hân", role: "Thiết kế trải nghiệm số", img: avatarUri("Trần Gia Hân", 200), status: "idle", ring: true },
    { name: "Lê Quốc Bảo", role: "Thiết kế tương tác", img: avatarUri("Lê Quốc Bảo", 150), status: "dnd", ring: true },
    { name: "Phạm Thu Trang", role: "Kiến trúc sư web", img: avatarUri("Phạm Thu Trang", 280), status: "offline" },
    { name: "Đặng Hữu Phúc", role: "Trưởng nhóm chuyển động", img: avatarUri("Đặng Hữu Phúc", 40), status: "online" },
    { name: "Võ Ngọc Diệp", role: "Kỹ sư thiết kế sản phẩm", img: avatarUri("Võ Ngọc Diệp", 330), status: "dnd", ring: true },
    { name: "Bùi Khánh Duy", role: "Thiết kế thương hiệu", img: avatarUri("Bùi Khánh Duy", 100), status: "idle" },
    { name: "Hoàng Lan Chi", role: "Kiến trúc sư design system", img: avatarUri("Hoàng Lan Chi", 230), status: "online", ring: true },
];
const STATUS_LABEL: Record<MemberStatus, string> = {
    online: "Trực tuyến",
    idle: "Vắng mặt",
    dnd: "Đang bận",
    offline: "Ngoại tuyến",
};
const Chevron = ({ d }: {
    d: string;
}) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d}/>
  </svg>);
function Highlight({ text, query }: {
    text: string;
    query: string;
}) {
    const q = query.trim();
    if (!q)
        return <>{text}</>;
    const at = text.toLowerCase().indexOf(q.toLowerCase());
    if (at < 0)
        return <>{text}</>;
    return (<>
      {text.slice(0, at)}
      <mark className="pmem__mark">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>);
}
function Photo({ src, alt, className }: {
    src: string;
    alt: string;
    className: string;
}) {
    const [state, setState] = useState<"loading" | "ready" | "broken">("loading");
    const ref = useRef<HTMLImageElement>(null);
    useEffect(() => {
        const img = ref.current;
        if (img?.complete && img.naturalWidth)
            setState("ready");
    }, [src]);
    return (<img ref={ref} className={className} src={src} alt={alt} draggable={false} data-state={state} onLoad={() => setState("ready")} onError={() => setState("broken")}/>);
}
export default function AddMember({ corner = 20, rows = 4, theme = "light", open: startOpen = false, members = DEFAULT_MEMBERS, onAdd, search = true, }: AddMemberProps) {
    const gooId = `pmem-goo-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const radius = Math.min(40, Math.max(0, Number(corner)));
    const perPage = Math.min(4, Math.max(2, Number(rows) || 4));
    const [query, setQuery] = useState("");
    const needle = query.trim().toLowerCase();
    const matches = members
        .map((person, id) => ({ person, id }))
        .filter(({ person }) => !needle ||
        person.name.toLowerCase().includes(needle) ||
        person.role.toLowerCase().includes(needle));
    const pages = Math.max(1, Math.ceil(matches.length / perPage));
    const [page, setPage] = useState(0);
    const [picked, setPicked] = useState<number[]>([]);
    const [isOpen, setIsOpen] = useState(Boolean(startOpen));
    const [confirming, setConfirming] = useState(false);
    const [added, setAdded] = useState(0);
    const shellRef = useRef<HTMLDivElement>(null);
    const chevronRef = useRef<HTMLSpanElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const stackRef = useRef<HTMLDivElement>(null);
    const countRef = useRef<HTMLSpanElement>(null);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const checkRef = useRef<HTMLSpanElement>(null);
    const flyRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const pickedRef = useRef(picked);
    pickedRef.current = picked;
    const openRef = useRef(isOpen);
    openRef.current = isOpen;
    const busyRef = useRef(false);
    const confirmingRef = useRef(false);
    const barShownRef = useRef(false);
    const paintIdRef = useRef(0);
    const enterRef = useRef<{
        direction: number;
        delay: number;
    } | null>(null);
    const onAddRef = useRef(onAdd);
    onAddRef.current = onAdd;
    const slice = matches.slice(page * perPage, page * perPage + perPage);
    function setToggle(btn: HTMLElement, on: boolean, animated = true) {
        const fill = btn.querySelector<HTMLElement>(".pmem__fill");
        const sign = btn.querySelector<SVGElement>(".pmem__sign");
        const barV = btn.querySelector<SVGElement>(".pmem__barV");
        const ring = btn.querySelector<HTMLElement>(".pmem__ring");
        const blobs = btn.querySelectorAll<HTMLElement>(".pmem__blob");
        if (!fill || !sign || !barV || !ring)
            return;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-pressed", String(on));
        const t = animated ? OUT : { duration: 0 };
        animate(fill, { scale: on ? 1 : 0, opacity: on ? 1 : 0 }, animated ? SPRING : { duration: 0 });
        animate(ring, { opacity: on ? 0 : 1, scale: on ? 0.82 : 1 }, t);
        animate(barV, { scaleY: on ? 0 : 1, opacity: on ? 0 : 1 }, t);
        animate(sign, { rotate: on ? 180 : 0 }, t);
        const tokenKey = "pmemToken";
        const token = String(Number(btn.dataset[tokenKey] ?? 0) + 1);
        btn.dataset[tokenKey] = token;
        const land = () => {
            if (btn.dataset[tokenKey] !== token)
                return;
            commit(fill, { transform: on ? "scale(1)" : "scale(0)", opacity: on ? "1" : "0" });
            commit(ring, { transform: on ? "scale(0.82)" : "scale(1)", opacity: on ? "0" : "1" });
            commit(barV, { transform: on ? "scaleY(0)" : "scaleY(1)", opacity: on ? "0" : "1" });
            commit(sign, { transform: on ? "rotate(180deg)" : "rotate(0deg)" });
            blobs.forEach((b) => commit(b, { opacity: "0" }));
        };
        if (!animated) {
            land();
            return;
        }
        setTimeout(land, 800);
        if (on) {
            blobs.forEach((b, i) => {
                const dir = i === 0 ? -1 : 1;
                animate(b, { opacity: [1, 1, 0], scale: [0.2, 0.6, 0.1], x: [0, dir * 15, 0], y: [0, dir * -11, 0] }, { duration: 0.56, ease: "easeOut", delay: i * 0.04 });
            });
        }
    }
    function barHeight() {
        const bar = barRef.current;
        if (!bar)
            return 0;
        const prev = bar.style.height;
        bar.style.height = "auto";
        const h = bar.scrollHeight;
        bar.style.height = prev;
        return h;
    }
    async function showBar() {
        const bar = barRef.current;
        if (!bar || barShownRef.current)
            return;
        barShownRef.current = true;
        const anim = animate(bar, { height: [0, barHeight()], opacity: [0, 1] }, { ...OUT, duration: 0.34 });
        const done = () => barShownRef.current && commit(bar, { height: "auto", opacity: "1" });
        void anim.then(done);
        setTimeout(done, 900);
        await settle(anim, 600);
    }
    async function hideBar() {
        const bar = barRef.current;
        if (!bar || !barShownRef.current)
            return;
        barShownRef.current = false;
        const anim = animate(bar, { height: [bar.offsetHeight, 0], opacity: [1, 0] }, { ...OUT, duration: 0.3 });
        const done = () => !barShownRef.current && commit(bar, { height: "0px", opacity: "0" });
        void anim.then(done);
        setTimeout(done, 900);
        await settle(anim, 600);
    }
    function flyToStack(avatar: HTMLElement, targetId: number) {
        const stack = stackRef.current;
        const shell = shellRef.current;
        const layer = flyRef.current;
        if (!stack || !shell || !layer)
            return;
        const target = stack.querySelector<HTMLElement>(`.pmem__chip[data-id="${targetId}"]`) ??
            stack.querySelector<HTMLElement>(".pmem__more");
        if (!target)
            return;
        const base = shell.getBoundingClientRect();
        const from = avatar.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        if (!to.width)
            return;
        target.style.opacity = "0";
        const clone = document.createElement("span");
        clone.className = "pmem__ghost";
        clone.style.left = `${from.left - base.left}px`;
        clone.style.top = `${from.top - base.top}px`;
        clone.style.width = `${from.width}px`;
        clone.style.height = `${from.width}px`;
        const img = document.createElement("img");
        img.src = avatar.querySelector("img")?.src ?? "";
        img.alt = "";
        clone.appendChild(img);
        layer.appendChild(clone);
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const scale = to.width / from.width;
        let landed = false;
        const land = () => {
            if (landed)
                return;
            landed = true;
            clone.remove();
            target.style.opacity = "";
            animate(target, { scale: [0.2, 1], opacity: [0, 1] }, SNAP);
            setTimeout(() => commit(target, { transform: "", opacity: "" }), 700);
            if (countRef.current)
                animate(countRef.current, { opacity: [0.4, 1], y: [4, 0] }, QUICK);
        };
        const flight = animate(clone, { x: [0, dx * 0.55, dx], y: [0, dy * 0.45 - 22, dy], scale: [1, 0.8, scale], opacity: [1, 1, 0.95] }, { duration: 0.52, ease: EASE });
        void settle(flight, 900).then(land);
    }
    async function addToStack(id: number, avatar: HTMLElement) {
        if (pickedRef.current.includes(id))
            return;
        flushSync(() => setPicked((list) => [...list, id]));
        await showBar();
        flyToStack(avatar, id);
    }
    function removeFromStack(id: number) {
        const chip = stackRef.current?.querySelector<HTMLElement>(`.pmem__chip[data-id="${id}"]`);
        const drop = () => {
            const next = pickedRef.current.filter((x) => x !== id);
            flushSync(() => setPicked(next));
            if (!next.length)
                void hideBar();
            else {
                const chips = stackRef.current?.querySelectorAll<HTMLElement>(".pmem__chip");
                if (chips?.length)
                    animate(chips, { scale: [0.88, 1], opacity: [0.4, 1] }, QUICK);
            }
        };
        if (!chip) {
            drop();
            return;
        }
        void settle(animate(chip, { scale: 0.2, opacity: 0, y: 8 }, QUICK), 500).then(drop);
    }
    function onToggle(id: number, btn: HTMLElement, avatar: HTMLElement) {
        if (confirmingRef.current)
            return;
        const on = !pickedRef.current.includes(id);
        setToggle(btn, on);
        if (on)
            void addToStack(id, avatar);
        else
            removeFromStack(id);
    }
    async function confirmAdd() {
        const list = pickedRef.current;
        if (confirmingRef.current || !list.length)
            return;
        confirmingRef.current = true;
        setConfirming(true);
        setAdded(list.length);
        const cta = ctaRef.current;
        if (cta)
            animate(cta, { scale: [1, 0.94, 1.03, 1] }, { duration: 0.5, ease: EASE });
        if (checkRef.current)
            animate(checkRef.current, { scale: [0, 1], rotate: [-25, 0] }, SNAP);
        const chips = stackRef.current?.querySelectorAll<HTMLElement>(".pmem__chip");
        if (chips?.length)
            animate(chips, { y: [0, -6, 0] }, { duration: 0.45, ease: EASE, delay: stagger(0.05) });
        onAddRef.current?.(list.map((i) => members[i]?.name ?? ""));
        await new Promise((resolve) => setTimeout(resolve, 1500));
        listRef.current?.querySelectorAll<HTMLElement>(".pmem__toggle.is-on").forEach((btn) => setToggle(btn, false));
        await hideBar();
        setPicked([]);
        confirmingRef.current = false;
        setConfirming(false);
    }
    function measure() {
        const body = bodyRef.current;
        if (!body)
            return 0;
        const prev = body.style.height;
        body.style.height = "auto";
        const h = body.scrollHeight;
        body.style.height = prev;
        return h;
    }
    function enterRows(direction = 1, delay = 0) {
        const rowsEls = Array.from(listRef.current?.querySelectorAll<HTMLElement>(".pmem__row") ?? []);
        if (!rowsEls.length)
            return;
        const token = ++paintIdRef.current;
        animate(rowsEls, { opacity: [0, 1], x: [direction * 18, 0], y: [12, 0] }, { ...OUT, delay: stagger(0.06, { startDelay: delay }) });
        setTimeout(() => {
            if (token !== paintIdRef.current)
                return;
            rowsEls.forEach((r) => commit(r, { opacity: "", transform: "" }));
        }, 1000 + delay * 1000);
    }
    async function setOpen(next: boolean) {
        const body = bodyRef.current;
        if (!body || busyRef.current || next === openRef.current)
            return;
        openRef.current = next;
        setIsOpen(next);
        if (chevronRef.current)
            animate(chevronRef.current, { rotate: next ? 0 : 180 }, OUT);
        busyRef.current = true;
        const full = measure();
        if (next) {
            animate(body, { opacity: 1 }, QUICK);
            enterRows(1, 0.06);
            const anim = animate(body, { height: [0, full] }, SPRING);
            const done = () => openRef.current && commit(body, { height: "auto", opacity: "1" });
            void anim.then(done);
            setTimeout(done, 1400);
            await settle(anim, 800);
        }
        else {
            const rowsEls = listRef.current?.querySelectorAll<HTMLElement>(".pmem__row");
            if (rowsEls?.length)
                animate(rowsEls, { opacity: 0, y: -8 }, { duration: 0.18, ease: EASE });
            const anim = animate(body, { height: [full, 0], opacity: [1, 0] }, { ...OUT, duration: 0.36 });
            const done = () => !openRef.current && commit(body, { height: "0px", opacity: "0" });
            void anim.then(done);
            setTimeout(done, 900);
            await settle(anim, 600);
        }
        busyRef.current = false;
    }
    function syncToggles() {
        listRef.current?.querySelectorAll<HTMLElement>(".pmem__row").forEach((row) => {
            const btn = row.querySelector<HTMLElement>(".pmem__toggle");
            if (btn)
                setToggle(btn, pickedRef.current.includes(Number(row.dataset.id)), false);
        });
    }
    function onQuery(next: string) {
        const body = bodyRef.current;
        const from = openRef.current && body ? body.offsetHeight : null;
        flushSync(() => {
            setQuery(next);
            setPage(0);
        });
        syncToggles();
        enterRows(1);
        if (!body || from === null)
            return;
        const to = measure();
        if (Math.abs(to - from) < 1)
            return;
        const anim = animate(body, { height: [from, to] }, SPRING);
        const done = () => openRef.current && commit(body, { height: "auto" });
        void anim.then(done);
        setTimeout(done, 1000);
    }
    async function turn(direction: number) {
        if (busyRef.current || confirmingRef.current || pages < 2)
            return;
        if (!openRef.current) {
            void setOpen(true);
            return;
        }
        busyRef.current = true;
        const rowsEls = listRef.current?.querySelectorAll<HTMLElement>(".pmem__row");
        if (rowsEls?.length) {
            await settle(animate(rowsEls, { opacity: 0, x: -direction * 18 }, { duration: 0.2, ease: EASE, delay: stagger(0.03, { from: direction > 0 ? "first" : "last" }) }), 500);
        }
        enterRef.current = { direction, delay: 0 };
        setPage((p) => (p + direction + pages) % pages);
        busyRef.current = false;
    }
    useLayoutEffect(() => {
        syncToggles();
        const pending = enterRef.current;
        if (!pending)
            return;
        enterRef.current = null;
        enterRows(pending.direction, pending.delay);
    }, [page]);
    useLayoutEffect(() => {
        const bar = barRef.current;
        const body = bodyRef.current;
        const shell = shellRef.current;
        if (!bar || !body || !shell)
            return;
        commit(bar, { height: "0px", opacity: "0" });
        commit(body, { height: openRef.current ? "auto" : "0px", opacity: openRef.current ? "1" : "0" });
        if (chevronRef.current)
            chevronRef.current.style.transform = openRef.current ? "none" : "rotate(180deg)";
        animate(shell, { opacity: [0, 1], y: [24, 0], scale: [0.96, 1] }, { ...OUT, duration: 0.5 });
        const rescue = setTimeout(() => commit(shell, { opacity: "1", transform: "" }), 900);
        if (openRef.current)
            enterRows(1, 0.12);
        return () => clearTimeout(rescue);
    }, []);
    const pressProps = (down: Record<string, number>, up: Record<string, number> = { scale: 1 }) => ({
        onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
            if (event.button === 0)
                animate(event.currentTarget, down, SNAP);
        },
        onPointerUp: (event: React.PointerEvent<HTMLElement>) => animate(event.currentTarget, up, SNAP),
        onPointerLeave: (event: React.PointerEvent<HTMLElement>) => animate(event.currentTarget, up, SNAP),
        onPointerCancel: (event: React.PointerEvent<HTMLElement>) => animate(event.currentTarget, up, SNAP),
    });
    const shown = picked.slice(0, MAX_CHIPS);
    const rest = picked.length - shown.length;
    const bodyId = `${gooId}-body`;
    return (<div className="pmem" data-theme={theme} style={{ "--r": `${radius}px` } as React.CSSProperties}>
      
      <svg className="pmem__defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id={gooId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -11" result="goo"/>
            <feBlend in="SourceGraphic" in2="goo"/>
          </filter>
        </defs>
      </svg>

      <div ref={shellRef} className="pmem__shell">
        <div className="pmem__card">
          <button className="pmem__head" type="button" aria-expanded={isOpen} aria-controls={bodyId} onClick={() => void setOpen(!openRef.current)} onPointerDown={() => chevronRef.current && animate(chevronRef.current, { scale: 0.88 }, SNAP)} onPointerUp={() => chevronRef.current && animate(chevronRef.current, { scale: 1 }, SNAP)} onPointerLeave={() => chevronRef.current && animate(chevronRef.current, { scale: 1 }, SNAP)}>
            <span className="pmem__title">Members Projects</span>
            <span ref={chevronRef} className="pmem__chevron">
              <Chevron d="m18 15-6-6-6 6"/>
            </span>
          </button>

          <div ref={bodyRef} className="pmem__body" id={bodyId}>
            {search && (<div className="pmem__search">
                <svg className="pmem__searchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7"/>
                  <path d="m20 20-3.5-3.5"/>
                </svg>
                <input ref={searchRef} className="pmem__searchInput" type="search" inputMode="search" enterKeyHint="search" placeholder="Search members" aria-label="Search members" autoComplete="off" spellCheck={false} value={query} onChange={(event) => onQuery(event.target.value)} onKeyDown={(event) => {
                if (event.key === "Escape" && query) {
                    event.preventDefault();
                    onQuery("");
                }
                if (event.key === "Enter")
                    event.preventDefault();
            }}/>
                {query && (<button className="pmem__searchClear" type="button" aria-label="Clear search" onClick={() => {
                    onQuery("");
                    searchRef.current?.focus();
                }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                      <path d="M7 7l10 10M17 7 7 17"/>
                    </svg>
                  </button>)}
              </div>)}

            <ul ref={listRef} className="pmem__list" aria-live="polite">
              {slice.length === 0 && (<li className="pmem__empty">
                  No one matches <strong>&ldquo;{query.trim()}&rdquo;</strong>
                </li>)}
              {slice.map(({ person, id }) => {
            const on = picked.includes(id);
            return (<li key={id} className="pmem__row" data-id={id} onClick={(event) => {
                    const row = event.currentTarget;
                    const btn = row.querySelector<HTMLElement>(".pmem__toggle");
                    const avatar = row.querySelector<HTMLElement>(".pmem__avatar");
                    if (btn && avatar)
                        onToggle(id, btn, avatar);
                }}>
                    <span className={`pmem__avatar${person.ring ? " is-ringed" : ""}`}>
                      <Photo className="pmem__photo" src={person.img} alt={person.name}/>
                      <span className={`pmem__dot is-${person.status}`} title={STATUS_LABEL[person.status]}/>
                    </span>
                    <span className="pmem__meta">
                      <span className="pmem__name">
                        <Highlight text={person.name} query={query}/>
                      </span>
                      <span className="pmem__role">
                        <Highlight text={person.role} query={query}/>
                      </span>
                    </span>
                    <button className={`pmem__toggle${on ? " is-on" : ""}`} type="button" aria-pressed={on} aria-label={`${on ? "Remove" : "Add"} ${person.name}`} onClick={(event) => {
                    event.stopPropagation();
                    const row = event.currentTarget.closest("li");
                    const avatar = row?.querySelector<HTMLElement>(".pmem__avatar");
                    if (avatar)
                        onToggle(id, event.currentTarget, avatar);
                }} {...pressProps({ scale: 0.9 })}>
                      <span className="pmem__goo" style={{ filter: `url(#${gooId})` }}>
                        <span className="pmem__fill"/>
                        <span className="pmem__blob"/>
                        <span className="pmem__blob"/>
                      </span>
                      <span className="pmem__ring"/>
                      <svg className="pmem__sign" viewBox="0 0 24 24" aria-hidden="true">
                        <rect className="pmem__bar" x="6.5" y="11" width="11" height="2" rx="1"/>
                        <rect className="pmem__bar pmem__barV" x="11" y="6.5" width="2" height="11" rx="1"/>
                      </svg>
                    </button>
                  </li>);
        })}
            </ul>

            <div ref={barRef} className="pmem__action">
              <div className="pmem__actionIn">
                <div ref={stackRef} className="pmem__stack" aria-label="Selected members">
                  {shown.map((id) => (<span key={id} className="pmem__chip" data-id={id}>
                      <img src={members[id]?.img} alt={members[id]?.name ?? ""} draggable={false}/>
                    </span>))}
                  {rest > 0 && <span className="pmem__chip pmem__more">+{rest}</span>}
                </div>
                <span ref={countRef} className="pmem__count">
                  {picked.length ? `${picked.length} selected` : ""}
                </span>
                <button ref={ctaRef} className={`pmem__cta${confirming ? " is-done" : ""}`} type="button" disabled={confirming} onClick={() => void confirmAdd()} {...pressProps({ scale: 0.96 })}>
                  <span className="pmem__ctaText">
                    {confirming ? `${added} ${added === 1 ? "person" : "people"} added` : "Add to Project"}
                  </span>
                  <span ref={checkRef} className="pmem__ctaCheck">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pmem__foot">
          <button className="pmem__all" type="button" onClick={() => {
            if (!openRef.current)
                void setOpen(true);
            else if (query)
                onQuery("");
            else
                void turn(1);
        }}>
            View All Members
          </button>
          <div className="pmem__nav">
            <button type="button" aria-label="Previous members" aria-disabled={pages < 2 || undefined} onClick={() => void turn(-1)} {...pressProps({ scale: 0.84, x: -2 }, { scale: 1, x: 0 })}>
              <Chevron d="m15 18-6-6 6-6"/>
            </button>
            <button type="button" aria-label="Next members" aria-disabled={pages < 2 || undefined} onClick={() => void turn(1)} {...pressProps({ scale: 0.84, x: 2 }, { scale: 1, x: 0 })}>
              <Chevron d="m9 18 6-6-6-6"/>
            </button>
          </div>
        </div>

        <div ref={flyRef} className="pmem__fly" aria-hidden="true"/>
      </div>
    </div>);
}
export { AddMember as AddMember };
