"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Pause, Play } from "lucide-react";

const MotionContext = createContext(true);
export const usePartyMotion = () => useContext(MotionContext);

/** A single preference controls the decorative layer; it never wraps business handlers. */
export default function PartyExperience({ children }: { children: ReactNode }) {
  const [motion, setMotion] = useState(true);
  useEffect(() => {
    try {
      setMotion(localStorage.getItem("pitterpan-admin-motion") !== "off");
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
  }, []);
  function toggle() {
    setMotion((current) => {
      const next = !current;
      try {
        localStorage.setItem("pitterpan-admin-motion", next ? "on" : "off");
      } catch {
        /* Preference still works for this visit. */
      }
      return next;
    });
  }
  return (
    <MotionContext.Provider value={motion}>
      <div className="admin-app" data-party-motion={motion ? "on" : "off"}>
        {children}
        <button
          className="party-motion-control"
          type="button"
          onClick={toggle}
          aria-pressed={!motion}
          aria-label={
            motion
              ? "Desativar animações decorativas do painel"
              : "Ativar animações decorativas do painel"
          }
          title={
            motion ? "Pausar efeitos decorativos" : "Ativar efeitos decorativos"
          }
        >
          {motion ? <Pause size={14} /> : <Play size={14} />}
          <span>Efeitos {motion ? "ativos" : "pausados"}</span>
        </button>
      </div>
    </MotionContext.Provider>
  );
}
