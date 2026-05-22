# APEX — Personal Training Studio

Sito web one-page per un personal trainer, tutto in un **unico file**
`index.html` da aprire con doppio click. Niente server, niente install.

## Come si usa

1. Apri `index.html` nel browser.
2. Clicca l'icona 🔑 nella chat "Coach AI" in basso a destra.
3. Incolla la tua API key Anthropic (crea quella su
   <https://console.anthropic.com/settings/keys>).
4. Fatto. La key resta solo nel tuo browser (localStorage).

## Cosa c'è dentro

- Hero animato, marquee, blob SVG morphing, parallax mouse
- 6 servizi (modale dettaglio) · 3 piani con switch mensile/trimestrale
- Slider before/after (drag, click, touch, tastiera)
- Carousel testimonianze (auto + manuale + swipe)
- Form prenotazione con validazione + feedback toast
- FAQ accordion · newsletter · footer completo · torna-su
- Toggle tema scuro/chiaro
- **Coach AI**: chat con streaming, suggerimenti rapidi, persistenza,
  collegata direttamente all'API Claude (modello Haiku 4.5)

## Tweaks rapidi (cerca dentro `index.html`)

- Brand / coach: cerca `APEX` e `Marco Conti`
- Colori: token CSS in `:root` (variabile principale `--accent`)
- System prompt Coach AI: costante `SYSTEM_PROMPT` nello script
- Modello: costante `MODEL` (es. `claude-haiku-4-5-20251001`)
