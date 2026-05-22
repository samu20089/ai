# APEX — Personal Training Studio

Sito web one-page per un personal trainer, con animazioni fluide,
forme organiche, design dark+lime e un assistente AI ("Coach AI")
collegato all'API di Claude.

## Stack

- **Backend**: Node.js + Express, endpoint `/api/chat` con streaming SSE
- **Frontend**: HTML/CSS/JS vanilla, niente framework, niente build step
- **AI**: `@anthropic-ai/sdk` con prompt caching sul system prompt

## Setup

```bash
# 1. Installa dipendenze
npm install

# 2. Copia env e inserisci la tua chiave Anthropic
cp .env.example .env
#  → poi apri .env e incolla la tua ANTHROPIC_API_KEY

# 3. Avvia
npm start
```

Sito su [http://localhost:3000](http://localhost:3000).

Senza API key il sito funziona comunque (animazioni, form, modal),
ma la chat AI risponde con un avviso di configurazione mancante.

## Cosa funziona

**Bottoni e interazioni (~30):**
- Menu nav con scroll smooth + sezione attiva
- Drawer mobile (burger animato)
- CTA hero + "Guarda il metodo" (apre modale)
- Toggle tema scuro/chiaro (persistente)
- Switch fatturazione mensile/trimestrale (prezzi animati)
- 6 card servizi → modal dettaglio per ciascuna
- 3 piani → modal di conferma per ciascuno
- Before/After slider (drag, click, touch, tastiera)
- Carousel testimonianze (auto + manuale + swipe + tastiera)
- Accordion FAQ (5 voci)
- Form di prenotazione con validazione e feedback toast
- Newsletter con validazione email
- Coach AI: apri/chiudi, suggerimenti rapidi, invio, streaming,
  nuova conversazione, persistenza in localStorage
- Bottone torna-su
- Magnetic buttons (CTA)
- Tilt 3D al hover su card

**Animazioni:**
- Loader iniziale con bar che si riempie e "APEX" che si colora
- Hero: parole che salgono in stagger
- Blob SVG morphing + ring rotanti + parallax mouse
- Counter animati on-view
- Reveal on-scroll con delay scalettati
- Marquee infinita
- Modal con scale+blur backdrop
- Toast slide-in
- Chat: bubble in, typing dots, cursore lampeggiante, stream

## Struttura

```
.
├── server.js                # Express + /api/chat
├── package.json
├── .env.example
└── public/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── main.js          # tutto tranne chat
        └── chat.js          # modulo chat AI
```

## Personalizzazione veloce

- **Brand / coach**: cerca "APEX", "Marco Conti" in `public/index.html`.
- **Colori**: token CSS in `:root` dentro `public/css/style.css`
  (variabile principale: `--accent` per il lime).
- **System prompt Coach AI**: costante `SYSTEM_PROMPT` in `server.js`.
- **Modello AI**: `claude-haiku-4-5-20251001` in `server.js`,
  cambiabile in qualsiasi modello Anthropic disponibile.
