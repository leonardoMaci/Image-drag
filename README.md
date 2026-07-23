# ImageBoard

Quadro interativo de imagens: cadastre imagens, arraste-as livremente sobre um
canvas com grade, selecione uma imagem para abrir um menu de ações e mantenha a
organização entre recarregamentos.

Implementação do MVP descrito no PRD, em **TypeScript**, com:

- **Next.js 14 (App Router)** + **React 18**
- **React Konva / Konva.js** para o quadro interativo
- **Zustand** para o estado do quadro
- **Prisma ORM** com **SQLite** (local-first, sem infraestrutura externa)
- **Armazenamento local** de arquivos em `public/uploads`
- **Tailwind CSS**

> O PRD sugere PostgreSQL + S3. Para rodar sem infraestrutura externa, este
> projeto usa SQLite e disco local, **mantendo a mesma arquitetura** — trocar
> por Postgres/S3 é isolado em `prisma/schema.prisma` e `src/lib/storage.ts`.

## Como rodar

Requer Node.js 18.18+ (ou 20+).

```bash
npm install          # instala deps e roda "prisma generate"
npm run db:push      # cria o banco SQLite (prisma/dev.db) a partir do schema
npm run dev          # http://localhost:3000
```

Fluxo rápido: abra `/images/new`, envie uma imagem com descrição, publique, e
ela aparece no quadro em `/`. Arraste, selecione, use o menu de três ações.

## Scripts

| Script             | Ação                                            |
| ------------------ | ----------------------------------------------- |
| `npm run dev`      | Servidor de desenvolvimento                     |
| `npm run build`    | `prisma generate` + build de produção           |
| `npm start`        | Sobe o build de produção                        |
| `npm run db:push`  | Aplica o schema Prisma ao banco                 |
| `npm run typecheck`| Checagem de tipos (`tsc --noEmit`)              |
| `npm test`         | Testes (Vitest) dos fluxos de validação críticos|

## Rotas

- `/` — Quadro principal (canvas Konva, zoom, pan, centralizar, contador)
- `/images` — Lista de imagens (editar / excluir)
- `/images/new` — Upload com pré-visualização e validação

## API

| Método | Rota                              | Descrição                        |
| ------ | --------------------------------- | -------------------------------- |
| GET    | `/api/images`                     | Lista imagens (ordenadas por camada) |
| POST   | `/api/upload`                     | Envia binário → URL + metadados  |
| POST   | `/api/images`                     | Cria registro no quadro          |
| PATCH  | `/api/images/:id/position`        | Salva coordenadas (fim do drag)  |
| PATCH  | `/api/images/:id`                 | Atualiza descrição / alt text    |
| POST   | `/api/images/:id/bring-to-front`  | Traz para a camada superior      |
| DELETE | `/api/images/:id`                 | Exclui registro + arquivo        |

## Decisões que atendem ao PRD

- **Persistência de posição**: durante o arraste a atualização é apenas local
  (fluida, sem requisições por pixel); a coordenada é gravada no `onDragEnd`.
  Em falha, a posição anterior é restaurada e um toast oferece nova tentativa.
- **Limites**: `dragBoundFunc` garante que uma parte mínima da imagem sempre
  permaneça dentro do quadro (nunca some por completo).
- **Camadas**: cada imagem tem `zIndex`; "Trazer para frente" recalcula o topo
  no servidor e no estado local.
- **Segurança**: no servidor validamos extensão, MIME, tamanho e **magic bytes**
  (bloqueia executáveis renomeados); descrições são sanitizadas e renderizadas
  sempre como texto.
- **Acessibilidade**: `alt` nas imagens, foco visível, seleção com contorno
  **e** sombra (não depende só de cor), diálogos com teclado (Esc).

## Estrutura

```
src/
├── app/                # páginas e rotas de API (App Router)
├── components/
│   ├── board/          # ImageBoard, BoardStage, BoardGrid, BoardImageNode, ImageActionMenu
│   ├── images/         # ImageUploadForm, ImagePreview, ImageList, EditImageDialog
│   └── ui/             # Button, Dialog, Field, Toaster, ConfirmDialog
├── services/           # image-service, upload-service (fetch client)
├── stores/             # board-store, toast-store (Zustand)
├── lib/                # prisma, storage, validation, utils
└── types/              # board-image
```

## Trocar para PostgreSQL + S3 (produção)

1. Em `prisma/schema.prisma`, mude `provider` para `postgresql` e defina
   `DATABASE_URL` para o Postgres. Rode `npx prisma migrate dev`.
2. Reimplemente `saveFile` / `deleteFile` em `src/lib/storage.ts` usando o SDK
   do S3/R2 (as assinaturas não mudam) e sirva URLs assinadas.

## Fora do escopo do MVP

Colaboração em tempo real, múltiplos quadros, redimensionar/rotacionar,
seleção múltipla, desfazer/refazer, snap-to-grid — planejados para fases
futuras conforme o PRD.
