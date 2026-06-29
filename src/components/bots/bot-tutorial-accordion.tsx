import { ExternalLink } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const steps = [
  ["Passo 1", "Abra o BotFather no Telegram."],
  ["Passo 2", "Envie o comando /newbot."],
  ["Passo 3", "Informe o nome publico do bot."],
  ["Passo 4", "Defina um username terminado em bot."],
  ["Passo 5", "Copie o token gerado e cole no campo acima."],
];

export function BotTutorialAccordion() {
  return (
    <Accordion type="single" collapsible className="rounded-md border border-white/10 px-4">
      <AccordionItem value="tutorial" className="border-b-0">
        <AccordionTrigger>Tutorial: Criar Bot no Telegram</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <Button asChild variant="outline" className="border-white/10">
              <a href="https://t.me/BotFather" target="_blank" rel="noreferrer">
                Abrir BotFather
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </Button>
            <div className="grid gap-3">
              {steps.map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-md border border-white/10 bg-black/20 p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-normal text-primary">
                    {title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
