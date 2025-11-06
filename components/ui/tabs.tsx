import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem<T extends string> = {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
};

export interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
}

export function Tabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <nav
      className={cn(
        "flex rounded-full border border-brand-slate/60 bg-brand-slate/40 p-1",
        className,
      )}
      aria-label="Primary tabs"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy",
              isActive
                ? "bg-brand-blue text-brand-white shadow-card"
                : "text-brand-gray hover:text-brand-white hover:bg-white/5",
            )}
            aria-pressed={isActive}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        );
      })}
    </nav>
  );
}

export default Tabs;
