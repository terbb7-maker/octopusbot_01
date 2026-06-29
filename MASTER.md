# MASTER.md

## Fonte de verdade do projeto

Este documento define a direcao tecnica, arquitetural e de produto do
**OctopusBot**.

Qualquer decisao futura de implementacao deve respeitar este arquivo. Quando
houver conflito entre uma sugestao, uma issue, uma decisao informal ou uma
implementacao existente, este documento prevalece ate ser atualizado
explicitamente.

---

## 1. Objetivo do projeto

O OctopusBot e um SaaS de automacao de vendas para Telegram com foco em bots,
fluxos, pagamentos PIX, clientes e operacao multi-tenant.

O MVP atual deve provar a fundacao operacional:

1. Usuario cria conta.
2. Sistema cria profile e workspace automaticamente.
3. Usuario conecta bots do Telegram com seguranca.
4. Dashboard exibe metricas reais de bots, eventos e pagamentos.
5. Pagamentos PIX sao registrados e acompanhados.
6. Clientes fica reservado como modulo oficial futuro.
7. Fluxos possui estrutura de banco preparada para builder, publicacao,
   versionamento e execucao futura.

### Escopo oficial do MVP atual

- Autenticacao de usuarios.
- Provisionamento automatico de profile e workspace.
- Dashboard autenticado.
- Gerenciamento de bots do Telegram.
- Registro e acompanhamento de pagamentos.
- Estrutura de Clientes.
- Estrutura de Fluxos.
- Configuracoes basicas do workspace.

### Removido do MVP

Os modulos abaixo nao fazem parte da arquitetura atual e nao devem existir no
codigo, navegacao, tipos, services, rotas, APIs ou queries:

- Produtos.
- Pedidos.
- Entregas.
- Automacoes legadas.

Qualquer retomada desses dominios exige nova aprovacao explicita e atualizacao
deste arquivo.

---

## 2. Stack oficial

### Aplicacao

- Next.js 15.
- TypeScript.
- App Router.
- React.
- Tailwind CSS.
- shadcn/ui.

### Backend e dados

- Supabase Auth.
- Supabase Postgres.
- Supabase Row Level Security.
- Supabase Storage apenas quando houver uso real aprovado.
- Supabase Realtime apenas quando houver necessidade real aprovada.

### Deploy e infraestrutura

- Vercel.
- Route Handlers do Next.js para APIs HTTP e webhooks.
- Variaveis de ambiente da Vercel para configuracao sensivel.

### Integracoes externas

- Telegram Bot API.
- Gateway PIX por adapter interno.

Dependencias devem existir apenas quando utilizadas pelo MVP atual.

---

## 3. Regras de desenvolvimento

- Seguir este `MASTER.md` antes de qualquer implementacao.
- Nao criar funcionalidades fora do escopo aprovado.
- Toda regra de negocio deve ficar em services ou server actions, nao em
  componentes visuais.
- Componentes React devem ser pequenos, tipados e reutilizaveis.
- Arquivos devem ter no maximo 250 linhas sempre que possivel.
- Todo acesso ao banco deve passar por camada de servidor apropriada.
- Componentes client-side nao podem consultar Supabase diretamente quando a
  operacao envolve dado sensivel.
- Nenhum segredo pode ser exposto no frontend.
- Toda mutacao interna deve usar Server Actions quando fizer sentido.
- Toda API publica ou webhook deve validar payload, origem e idempotencia.
- Codigo morto deve ser removido, nao escondido.
- Rotas removidas nao devem continuar no menu, middleware, services ou tipos.

---

## 4. Padroes de codigo

### TypeScript

- Usar tipagem estrita.
- Evitar `any`.
- Preferir tipos explicitos para contratos entre services e componentes.
- Tipos de banco ficam em `src/types/database`.
- Tipos de dominio compartilhados ficam em `src/types/domain`.

### Services

- Services ficam em `src/server/services`.
- Services consultam dados, aplicam regras de negocio e entregam DTOs para UI.
- Services nao devem importar componentes React.
- Services nao devem conhecer detalhes visuais da aplicacao.

### Server Actions

- Server Actions ficam em `src/server/actions`.
- Server Actions validam input, chamam services e fazem `revalidatePath` ou
  refresh quando necessario.
- Server Actions nunca retornam segredos.

### Adapters

- Integracoes externas ficam em `src/server/adapters`.
- Telegram, PIX e outros fornecedores devem ficar isolados do dominio.
- A aplicacao fala com conceitos internos, nao com detalhes de fornecedor.

### API Routes

- Route Handlers ficam em `src/app/api`.
- Webhooks ficam em `src/app/api/webhooks`.
- Rotas HTTP devem ser finas e delegar para services/adapters.

---

## 5. Padroes de UI

- UI premium, moderna e responsiva.
- Tema dark como experiencia nativa.
- Usar Tailwind CSS e shadcn/ui.
- Sidebar deve exibir apenas:
  - Dashboard.
  - Bots.
  - Fluxos.
  - Pagamentos.
  - Clientes.
  - Configuracoes.
- Cards com bordas discretas, cantos arredondados e sombras suaves.
- Estados vazios devem ser elegantes, informativos e coerentes com o modulo.
- Nao usar textos que prometam funcionalidades ainda nao implementadas.
- Nao criar landing page dentro da area autenticada.
- Dashboard deve consumir dados atraves de services.

---

## 6. Estrutura de pastas

```txt
src/
  app/
    (auth)/
      login/
      register/
      reset-password/
      update-password/

    (dashboard)/
      dashboard/
      bots/
      flows/
      payments/
      customers/
      settings/
      layout.tsx

    api/
      telegram/
      payments/
      webhooks/
        telegram/
        payments/

    auth/
      callback/

    layout.tsx
    page.tsx
    globals.css

  components/
    ui/
    layout/
    auth/
    bots/
    dashboard/
    shared/

  config/
    app/
    constants/
    navigation/

  features/
    auth/

  lib/
    security/
    supabase/
    telegram/
    payments/
    validators/

  server/
    actions/
    adapters/
      telegram/
    services/
      bots/
      dashboard/

  types/
    database/
    domain/
```

Pastas de `products`, `orders`, `deliveries` e `automations` nao devem ser
criadas sem aprovacao previa.

---

## 7. Responsabilidade das pastas

- `src/app`: rotas, layouts, route handlers e paginas do App Router.
- `src/components/ui`: primitives shadcn/ui.
- `src/components/layout`: shell, sidebar, mobile navigation e estrutura global.
- `src/components/auth`: componentes de autenticacao.
- `src/components/bots`: componentes do modulo Bots.
- `src/components/dashboard`: componentes visuais do Dashboard.
- `src/components/shared`: componentes genericos compartilhados.
- `src/config`: configuracoes estaticas de aplicacao e navegacao.
- `src/features/auth`: fluxo de autenticacao e provisionamento.
- `src/lib/security`: variaveis de ambiente, criptografia e utilitarios
  sensiveis.
- `src/lib/supabase`: clients Supabase para browser, server, middleware e
  service role.
- `src/lib/telegram`: helpers publicos de Telegram quando necessarios.
- `src/lib/payments`: interfaces e helpers do dominio de pagamentos.
- `src/server/actions`: Server Actions.
- `src/server/adapters`: comunicacao com APIs externas.
- `src/server/services`: regras de negocio e consultas do servidor.
- `src/types`: contratos TypeScript compartilhados.
- `supabase/migrations`: evolucao do schema Supabase.

---

## 8. Convencoes de nomenclatura

- Arquivos React: `kebab-case.tsx`.
- Services: `nome-service.ts`.
- Actions: `nome.ts` dentro de `src/server/actions`.
- Tipos: PascalCase para types e interfaces.
- Variaveis e funcoes: camelCase.
- Constantes globais: SCREAMING_SNAKE_CASE.
- Rotas: ingles, plural e kebab-case quando necessario.
- Tabelas Supabase: plural em snake_case.
- Colunas Supabase: snake_case.
- Policies RLS: `tabela_acao_contexto`.

Rotas oficiais atuais:

- `/dashboard`.
- `/bots`.
- `/flows`.
- `/payments`.
- `/customers`.
- `/settings`.

---

## 9. Banco de dados

Tabelas oficiais do MVP atual:

- `profiles`.
- `workspaces`.
- `workspace_members`.
- `telegram_bots`.
- `telegram_chats`.
- `telegram_events`.
- `payments`.
- `pix_charges`.
- `payment_events`.
- `flows`.
- `flow_versions`.
- `flow_version_nodes`.
- `flow_version_edges`.
- `flow_bot_bindings`.
- `flow_deployments`.
- `flow_deployment_variants`.
- `flow_sessions`.
- `flow_run_steps`.
- `flow_events`.
- `flow_experiments`.
- `workspace_integrations`.
- `flow_ai_profiles`.
- `webhook_inbox`.
- `audit_logs`.

Objetos removidos da arquitetura atual:

- `products`.
- `product_assets`.
- `product_delivery_rules`.
- `orders`.
- `deliveries`.
- `delivery_attempts`.
- `automation_flows`.
- `automation_versions`.
- `automation_runs`.
- `automation_run_steps`.
- Bucket `product-assets`.

Pagamentos nao devem depender de pedidos no MVP atual.

---

## 10. Regras de seguranca

- RLS deve estar ativo em todas as tabelas expostas ao usuario.
- Usuario so acessa dados de workspaces dos quais e membro ativo.
- Tokens de bots devem ser criptografados antes de persistir.
- Tokens de bots nunca podem voltar para o frontend.
- Service role deve ser usada apenas em codigo server-side.
- Variaveis sensiveis devem ser lidas por helpers centralizados.
- Webhooks devem registrar payload bruto em `webhook_inbox` quando aplicavel.
- Eventos externos devem ser tratados como nao confiaveis.
- Toda operacao de exclusao sensivel deve preservar auditoria quando houver
  impacto operacional.

---

## 11. Regras para futuras implementacoes

- Antes de implementar modulo novo, atualizar este `MASTER.md`.
- Fluxos substituem Automacoes legadas; nao reutilizar nomes, tabelas ou rotas
  `automation_*` sem nova aprovacao.
- Clientes deve nascer como modulo proprio, nao como derivacao de pedidos.
- Pagamentos deve continuar desacoplado de pedidos/produtos.
- Toda nova tabela precisa de:
  - objetivo claro;
  - indices;
  - chaves estrangeiras;
  - regras de negocio;
  - policies RLS.
- Toda nova dependencia precisa justificar uso real no codigo.
- Toda nova pagina autenticada deve entrar no middleware e na navegacao apenas
  se fizer parte do MVP aprovado.
- Nao recriar Produtos, Pedidos, Entregas ou Automacoes sem aprovacao explicita.
