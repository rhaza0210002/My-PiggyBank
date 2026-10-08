"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  label: string;
  /** Classes du conteneur des panneaux (par défaut : il occupe la hauteur restante). */
  panelClassName?: string;
}

/** Onglets accessibles (rôles ARIA, flèches, Début/Fin) : un seul bloc à la fois, pour ne pas disperser l'attention. */
export default function Tabs({ tabs, label, panelClassName = 'min-h-0 flex-1 overflow-y-auto pt-2' }: TabsProps) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  const focusTab = (id: string) => {
    setActiveId(id);
    tabRefs.current[id]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    focusTab(tabs[target].id);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" aria-label={label} className="flex shrink-0 flex-wrap justify-center gap-1.5 pb-1">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab.id;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              id={`${baseId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveId(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className="min-h-11 shrink-0 rounded-full border-2 border-[#d8b7a5] bg-[#fff8f2] px-4 text-sm font-semibold text-[#5a4d41] transition hover:-translate-y-0.5 hover:bg-[#F8D5CB] motion-safe:hover:animate-[wiggle_0.4s_ease-in-out_1] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] aria-selected:border-[#a3452a] aria-selected:bg-[#F8D5CB] aria-selected:font-bold aria-selected:text-[#7a2f1a]"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${activeTab.id}`}
        aria-labelledby={`${baseId}-tab-${activeTab.id}`}
        tabIndex={0}
        className={`${panelClassName} outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]`}
      >
        {activeTab.content}
      </div>
    </div>
  );
}
