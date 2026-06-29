"use client";

import { useMemo, useState } from "react";

import {
  basicEditorSections,
  type BasicEditorSectionId,
} from "@/components/flows/editor/basic-editor-sections";
import { BasicEditorSidebar } from "@/components/flows/editor/basic-editor-sidebar";
import { TelegramPreview } from "@/components/flows/editor/telegram-preview";
import type { BasicFlowEditorData } from "@/server/services/flows";

export function FlowEditor({ flow }: { flow: BasicFlowEditorData }) {
  const [activeSectionId, setActiveSectionId] =
    useState<BasicEditorSectionId>(basicEditorSections[0].id);
  const activeSection = useMemo(
    () =>
      basicEditorSections.find((section) => section.id === activeSectionId) ??
      basicEditorSections[0],
    [activeSectionId],
  );
  const Section = activeSection.component;

  return (
    <main className="mx-auto grid w-full max-w-[1700px] gap-5 p-4 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_390px] lg:p-8">
      <BasicEditorSidebar
        sections={basicEditorSections}
        activeSectionId={activeSectionId}
        onSectionChange={setActiveSectionId}
      />
      <section aria-labelledby={`${activeSection.id}-title`}>
        <Section flow={flow} />
      </section>
      <TelegramPreview />
    </main>
  );
}
