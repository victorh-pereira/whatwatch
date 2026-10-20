# 🎬 WhatWatch

Plataforma web de descoberta de filmes e séries com experiência inspirada na
Netflix: tema escuro, banners em alta qualidade, carrosséis por categoria,
trailers integrados, elenco, plataformas de streaming (Brasil) e uma biblioteca
pessoal com favoritos, listas "quero assistir/assistido", avaliações e histórico.

**🌐 Site em produção:** https://whatwatch-tau.vercel.app

---

## ✨ Funcionalidades

- **Home dinâmica** — banner com destaques (setas manuais) e carrosséis:
  vistos recentemente, em alta na semana, novos filmes, novas séries, em breve
  nos cinemas, populares, melhores avaliados e gêneros variados.
- **Modal de detalhes** — trailer integrado (PT-BR quando disponível),
  sinopse, ano, classificação indicativa, duração/temporadas, nota, elenco
  principal, plataformas de streaming no Brasil e títulos semelhantes.
- **Busca dinâmica** — sugestões em tempo real enquanto você digita.
- **Exploração com filtros combináveis** — tipo (tudo/filmes/séries), gênero,
  ano e ordenação:
  - **Ano**: lista suspensa de 1950 até o ano atual.
  - **Ordenação**: mais populares, melhor avaliados, mais recentes e maior
    bilheteria (a ordenação por nota exige um mínimo de votos, evitando títulos
    obscuros com poucas avaliações).
  - Botão **Limpar filtros** quando há filtros ativos.
- **Conta de usuário (Supabase)** — cadastro e login com e-mail e senha,
  sessões persistentes.
- **Minha Biblioteca** — favoritos, "quero assistir", "assistidos",
  avaliações com estrelas (1 a 5) e histórico de visualizações.
  - Dar uma nota marca o título automaticamente como **assistido**.
  - Marcar como assistido remove o título de "quero assistir".
  - **Histórico sempre fresco**: é zerado a cada login e apagado ao sair,
    evitando acúmulo de dados no banco. Favoritos, listas e avaliações são
    preservados.

---

## 🗺️ Páginas e rotas

| Rota                | Página           | Descrição                                        |
| ------------------- | ---------------- | ------------------------------------------------ |
| `/`                 | Home             | Banner de destaque e carrosséis por categoria    |
| `/busca`            | Explorar / Busca | Busca com sugestões e filtros combináveis        |
| `/minha-biblioteca` | Minha Biblioteca | Favoritos, listas, avaliações e histórico        |

> O modal de detalhes abre como **overlay** sobre qualquer página, sem trocar
> de rota.

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
| Deploy        | Vercel (com deploy automático via GitHub)   |

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

### 🟢 Situação atual

O projeto **já está publicado** e com **deploy automático** configurado:

- **Site:** https://whatwatch-tau.vercel.app
- **Repositório:** https://github.com/victorh-pereira/whatwatch
- **Branch de produção:** `main`

A cada `git push` na branch `main`, a Vercel detecta a mudança e publica
automaticamente em produção (~20 segundos).

### 📤 Publicando alterações

```bash
git add .
git commit -m "descreva a mudança"
git push
```

Pronto — a Vercel cuida do build e do deploy sozinha. Não é preciso rodar
nenhum comando manual.

### 🔧 Configurando o deploy do zero (referência)

Caso precise recriar o projeto em outra conta/repositório:

1. **GitHub** — crie o repositório e envie o código:

   ```bash
   git init
   git add .
   git commit -m "feat: WhatWatch"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/whatwatch.git
   git push -u origin main
   ```

2. **Vercel** — acesse [vercel.com](https://vercel.com), entre com o GitHub e
   clique em **Add New → Project**, selecionando o repositório `whatwatch`.
   A Vercel detecta o Vite automaticamente.

3. **Variáveis de ambiente** — em **Environment Variables**, adicione:

   | Nome                     | Valor                          |
   | ------------------------ | ------------------------------ |
   | `VITE_TMDB_API_KEY`      | sua chave/token do TMDB        |
   | `VITE_SUPABASE_URL`      | URL do seu projeto Supabase    |
   | `VITE_SUPABASE_ANON_KEY` | sua chave pública do Supabase  |

4. Clique em **Deploy**. Em cerca de 1 minuto o site estará no ar. 🎉

> O arquivo `vercel.json` já está incluído com a configuração de rotas (SPA),
> então links como `/busca` funcionam ao recarregar a página.

### 🔑 Autorize o domínio no Supabase (importante)

No painel do Supabase, vá em **Authentication → URL Configuration**:

1. Em **Site URL**, coloque a URL do site publicado.
2. Em **Redirect URLs**, adicione a mesma URL (e `http://localhost:5173/**`
   para o desenvolvimento local).

Sem isso, o **login falha no site publicado**, pois o Supabase valida o domínio
de origem por segurança.

### ⚠️ Desative a proteção de deployment

Se o site pedir login da Vercel para ser visitado, verifique em
**Project Settings → Deployment Protection** se a opção **Vercel
Authentication** está ativa. Para um site público, ela deve estar **desligada**.

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

## 🧠 Notas técnicas

Detalhes de implementação que resolvem problemas específicos da API do TMDB e
do SDK do Supabase:

- **Tipo de mídia seguro** — uma função `resolveMediaType` normaliza o tipo
  (`movie`/`tv`) de qualquer item, evitando requisições para
  `/movie/undefined`.
- **Trailers** — busca vídeos em `pt` e `en-US` e remove duplicados por `key`,
  priorizando o trailer em português.
- **Plataformas de streaming** — o parâmetro `append_to_response` não retorna
  os provedores; por isso é usado o endpoint dedicado
  `/{type}/{id}/watch/providers` (região **BR**).
- **Novos filmes/séries** — usa `/discover` com filtro de data (últimos 90
  dias), em vez de `now_playing`/`on_the_air`, que trazem conteúdo desatualizado.
- **Filtro de ano** — o TMDB exige parâmetros diferentes por tipo:
  `primary_release_year` (filmes) e `first_air_date_year` (séries). Na busca
  com texto, gênero e ano são filtrados no cliente, pois `/search` não os
  suporta nativamente.
- **Login confiável** — o SDK do Supabase usa `navigator.locks` internamente,
  que em certos cenários pode travar e impedir a UI de reconhecer o login. O
  cliente usa um lock em memória e o `AuthContext` aplica a sessão diretamente
  a partir do retorno de `signIn`, sem depender apenas do evento assíncrono.
- **Histórico sempre fresco** — o histórico de visualizações é apagado ao
  **login** e ao **logout** (sempre com a sessão ativa, para respeitar a RLS),
  mantendo o banco leve. Favoritos, listas e avaliações são preservados.

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
