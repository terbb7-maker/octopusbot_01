import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PublishFlowButton } from "@/components/flows/editor/publish-flow-button";
import { SaveBar } from "@/components/flows/editor/save-bar";
import { Button } from "@/components/ui/button";
import type { BasicFlowEditorData } from "@/server/services/flows";

type BasicEditorHeaderProps = {
  flow: BasicFlowEditorData;
};

export function BasicEditorHeader({ flow }: BasicEditorHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-background/80 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="outline" className="border-white/10">
            <Link href="/flows">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Editor Basico
            </p>
            <h1 className="truncate text-xl font-semibold text-foreground sm:text-2xl">
              {flow.name}
            </h1>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <PublishFlowButton flowId={flow.id} />
          <SaveBar />
        </div>
      </div>
    </header>
  );
}
