export default function Footer() {
  return (
    <footer className="border-t border-ww-border bg-ww-bg px-4 py-8 text-center sm:px-6">
      <p className="text-sm font-semibold">
        <span className="text-ww-red">What</span>
        <span className="text-ww-text">Watch</span>
      </p>
      <p className="mt-2 text-xs leading-relaxed text-ww-muted">
        Dados de filmes e séries fornecidos pela{' '}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noreferrer"
          className="underline transition hover:text-ww-text"
        >
          TMDB
        </a>
        . Este produto não é endossado ou certificado pela TMDB.
      </p>
      <p className="mt-1 text-xs text-ww-muted">
        © {new Date().getFullYear()} WhatWatch — Feito com ❤️ para cinéfilos.
      </p>
    </footer>
  )
}
