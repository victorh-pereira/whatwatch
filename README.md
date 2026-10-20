# 🎬 WhatWatch

Plataforma web de descoberta de filmes e séries com experiência inspirada na
Netflix: tema escuro, banners em alta qualidade, carrosséis por categoria,
trailers integrados, elenco, plataformas de streaming (Brasil) e uma biblioteca
pessoal com favoritos, listas "quero assistir/assistido", avaliações e histórico.

---

## ✨ Funcionalidades

- **Home dinâmica** — banner com destaques (setas manuais) e carrosséis:
  vistos recentemente, em alta, novos filmes, novas séries, em breve nos
  cinemas, populares, melhores avaliados e gêneros variados.
- **Modal de detalhes** — trailer integrado (PT-BR quando disponível),
  sinopse, ano, classificação indicativa, duração/temporadas, nota, elenco
  principal, plataformas de streaming no Brasil e títulos semelhantes.
- **Busca dinâmica** — sugestões em tempo real enquanto você digita.
- **Exploração com filtros** — tipo (tudo/filmes/séries), gênero, ano e
  ordenação, combináveis entre si.
- **Conta de usuário (Supabase)** — cadastro e login com e-mail e senha,
  sessões persistentes.
- **Minha Biblioteca** — favoritos, "quero assistir", "assistidos",
  avaliações com estrelas (1 a 5) e histórico de visualizações.
  - Dar uma nota marca o título automaticamente como **assistido**.
  - Marcar como assistido remove o título de "quero assistir".

---

## 🧱 Stack

| Camada        | Tecnologia                                  |
| ------------- | ------------------------------------------- |
| Interface     | React 19 + Vite 6                           |
| Estilo        | Tailwind CSS 4                              |
| Rotas         | React Router 7                              |
| Dados         | [TMDB API](https://www.themoviedb.org/)     |
| Autenticação  | [Supabase](https://supabase.com/)           |
| Banco         | PostgreSQL (Supabase) com Row Level Security |

---

## 🚀 Rodando localmente

### 1. Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- Uma chave da API do TMDB
- Um projeto no Supabase (para login e listas pessoais)

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas chaves:

```bash
cp .env.example .env
```

Conteúdo do `.env`:

```env
# TMDB — https://www.themoviedb.org/settings/api
VITE_TMDB_API_KEY=sua_chave_ou_token_aqui

# Supabase — https://supabase.com/dashboard → Project Settings → API
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

> Aceita tanto a **Chave v3** quanto o **Read Access Token v4** do TMDB.

### 4. Criar as tabelas no Supabase

No painel do Supabase, abra **SQL Editor → New query** e execute, nesta ordem,
o conteúdo dos arquivos:

1. `supabase/schema.sql` — favoritos, avaliações e histórico
2. `supabase/schema_watchlist.sql` — quero assistir / assistido

Depois, adicione as colunas extras do histórico:

```sql
alter table public.watch_history add column if not exists release_date text;
alter table public.watch_history add column if not exists vote_average numeric;
```

### 5. Iniciar em modo de desenvolvimento

```bash
npm run dev
```

Acesse **http://localhost:5173**.

---

## 📜 Scripts disponíveis

| Comando           | Descrição                              |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento com hot reload |
| `npm run build`   | Gera a versão de produção em `dist/`   |
| `npm run preview` | Pré-visualiza a versão de produção     |

---

## ☁️ Deploy na Vercel

### 1. Suba o projeto para o GitHub

```bash
git init
git add .
git commit -m "feat: WhatWatch"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/whatwatch.git
git push -u origin main
```

### 2. Importe na Vercel

1. Acesse [vercel.com](https://vercel.com) e entre com a conta do GitHub.
2. Clique em **Add New → Project** e selecione o repositório `whatwatch`.
3. A Vercel detecta o Vite automaticamente.
4. **Antes de clicar em Deploy**, adicione as variáveis de ambiente em
   **Environment Variables**:

   | Nome                     | Valor                          |
   | ------------------------ | ------------------------------ |
   | `VITE_TMDB_API_KEY`      | sua chave/token do TMDB        |
   | `VITE_SUPABASE_URL`      | URL do seu projeto Supabase    |
   | `VITE_SUPABASE_ANON_KEY` | sua chave pública do Supabase  |

5. Clique em **Deploy**. Em cerca de 1 minuto seu site estará no ar. 🎉

> O arquivo `vercel.json` já está incluído com a configuração de rotas (SPA),
> então links como `/busca` funcionam ao recarregar a página.

### 3. (Importante) Autorize o domínio no Supabase

Depois do deploy, a Vercel te dará uma URL (ex.: `https://whatwatch.vercel.app`).
No painel do Supabase, vá em **Authentication → URL Configuration** e adicione
essa URL em **Site URL** e em **Redirect URLs**. Sem isso, o login pode falhar
no site publicado.

---

## 📁 Estrutura do projeto

```
whatwatch/
├─ public/                  arquivos estáticos
├─ src/
│  ├─ components/           Header, Carousel, MediaCard, DetailModal, Stars...
│  ├─ context/              AuthContext, LibraryContext, DetailModalContext
│  ├─ hooks/                useLibrary (favoritos, listas, avaliações, histórico)
│  ├─ lib/                  tmdb.js (API), supabase.js (cliente)
│  ├─ pages/                Home, Search, MyList
│  ├─ App.jsx               rotas e providers
│  ├─ main.jsx              ponto de entrada
│  └─ index.css             tema e design tokens
├─ supabase/                scripts SQL das tabelas
├─ .env.example             modelo das variáveis de ambiente
├─ vercel.json              configuração de deploy (SPA)
└─ vite.config.js
```

---

## 🔒 Segurança

- As chaves ficam no arquivo `.env`, que **nunca** é enviado ao Git.
- No Supabase, todas as tabelas usam **Row Level Security (RLS)**: cada
  usuário só consegue ler e alterar os próprios dados.
- A chave usada no front-end (`anon`/`publishable`) é pública por natureza —
  a proteção real vem das políticas de RLS.

---

## 📝 Créditos

Dados de filmes e séries fornecidos pela
[TMDB](https://www.themoviedb.org/). Este produto não é endossado ou
certificado pela TMDB.
