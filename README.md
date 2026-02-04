# Amplipátio

Sistema web single-user para gestão de pátio, finanças e parceiros com Next.js, Supabase e Vercel.

## Requisitos

- Node.js 18+
- Conta no Supabase
- Conta na Vercel

## Configuração local

1) Instale dependências:

```bash
npm install
```

2) Crie o arquivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=xxxxxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxx
```

3) Rode o projeto:

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Criar projeto no Supabase

1) Crie um novo projeto no Supabase.
2) Em **Project Settings > API**, copie `Project URL` e `anon public` para o `.env.local`.
3) Em **Authentication > Providers**, habilite Email/Password.
4) (Opcional) Desative novos cadastros após o primeiro acesso em **Authentication > Settings**.

## Migrations SQL

O schema está em `supabase/migrations/001_init.sql`.

Execute no SQL Editor do Supabase:

1) Abra **SQL Editor**.
2) Cole o conteúdo de `supabase/migrations/001_init.sql`.
3) Execute o script.

## Regras de acesso

- O sistema é single-user.
- O usuário permitido é `fernandolima@ampliauto.com.br`.
- Usuários com email diferente serão desconectados automaticamente.

## Deploy na Vercel

1) Suba o projeto para o GitHub.
2) Importe o repositório na Vercel.
3) Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4) Faça o deploy.

## Rotas protegidas

- `/login` é pública.
- Qualquer rota em `/app/*` exige login.
