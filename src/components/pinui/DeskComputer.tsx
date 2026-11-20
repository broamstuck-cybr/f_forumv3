import deskUrl from "./assets/desk-computer.svg";
import { useEffect, useRef, useState } from "react";
import { mountDeskComputer, type DeskEngine } from "./desk-computer-engine";
import "./desk-computer.css";
export type DeskComputerProps = {
    theme?: "light" | "dark";
    sound?: boolean;
    fill?: boolean;
    src?: string;
};
export default function DeskComputer({ theme = "light", sound = true, fill = false, src = deskUrl }: DeskComputerProps) {
    const stageRef = useRef<HTMLDivElement>(null);
    const artRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<HTMLSpanElement>(null);
    const engineRef = useRef<DeskEngine | null>(null);
    const soundRef = useRef(sound);
    soundRef.current = sound;
    const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
    useEffect(() => {
        const stage = stageRef.current;
        const art = artRef.current;
        const status = statusRef.current;
        if (!stage || !art || !status)
            return;
        const abort = new AbortController();
        let engine: DeskEngine | null = null;
        setState("loading");
        fetch(src, { signal: abort.signal })
            .then((r) => {
            if (!r.ok)
                throw new Error(`${r.status} ${r.statusText}`);
            return r.text();
        })
            .then((markup) => {
            if (abort.signal.aborted)
                return;
            art.innerHTML = markup;
            const svg = art.querySelector("svg");
            if (!svg)
                throw new Error("the drawing has no <svg>");
            engine = mountDeskComputer({ stage, svg, status, muted: !soundRef.current });
            engineRef.current = engine;
            setState("ready");
        })
            .catch((err: unknown) => {
            if (abort.signal.aborted)
                return;
            console.error("[DeskComputer]", err);
            setState("failed");
        });
        return () => {
            abort.abort();
            engine?.destroy();
            engineRef.current = null;
            art.innerHTML = "";
        };
    }, [src]);
    useEffect(() => {
        engineRef.current?.setMuted(!sound);
    }, [sound]);
    const firstTheme = useRef(true);
    useEffect(() => {
        if (firstTheme.current) {
            firstTheme.current = false;
            return;
        }
        engineRef.current?.replayIntro();
    }, [theme]);
    return (<div className="pdesk" data-theme={theme} data-fill={fill || undefined} data-ready={state === "ready" || undefined}>
      <div ref={stageRef} className="pdesk__stage" tabIndex={0} role="group" aria-label="Desk computer. Type to search on its screen; Enter searches; Escape or the monitor's power button switches the screen. Drag the mouse; click the CD to load it.">
        <div ref={artRef}/>
        <span ref={statusRef} className="pdesk__sr" role="status" aria-live="polite"/>
      </div>

      {state === "failed" && <p className="pdesk__error">The drawing couldn&rsquo;t be loaded from {src}.</p>}
    </div>);
}
export { DeskComputer as DeskComputer };
