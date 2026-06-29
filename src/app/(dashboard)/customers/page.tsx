import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        title="Clientes"
        description="Modulo reservado para contatos e historico de interacoes."
      />
      <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Nenhum cliente sincronizado</CardTitle>
            <CardDescription>
              Clientes serao exibidos aqui quando a camada de relacionamento for
              implementada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-dashed border-white/15 bg-black/20 p-6 text-sm leading-6 text-muted-foreground">
              Esta tela ainda nao possui funcionalidades ativas no MVP atual.
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
