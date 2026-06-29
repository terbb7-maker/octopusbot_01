"use client";

import { cn } from "@/lib/utils";
import type {
  BasicEditorSection,
  BasicEditorSectionId,
} from "@/components/flows/editor/basic-editor-sections";

type BasicEditorSidebarProps = {
  sections: BasicEditorSection[];
  activeSectionId: BasicEditorSectionId;
  onSectionChange: (sectionId: BasicEditorSectionId) => void;
};

export function BasicEditorSidebar({
  sections,
  activeSectionId,
  onSectionChange,
}: BasicEditorSidebarProps) {
  return (
    <aside className="rounded-lg border border-white/10 bg-white/[0.035] p-2 shadow-xl shadow-black/10 lg:sticky lg:top-5">
      <nav className="grid gap-1">
        {sections.map((section) => {
          const Icon = section.icon;
          const active = section.id === activeSectionId;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "flex min-h-14 w-full items-center gap-3 rounded-md px-3 text-left text-sm transition-colors",
                active
                  ? "border border-primary/25 bg-primary/12 text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {section.title}
                </span>
                <span className="block truncate text-xs opacity-80">
                  {section.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
