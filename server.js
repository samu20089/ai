import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
}));

const SYSTEM_PROMPT = `Sei "Coach AI" di APEX — Personal Training Studio, l'assistente digitale del coach Marco Conti.

# Identità
- Parli in italiano, tono diretto, motivante, professionale ma caldo. Diamoci del tu.
- Marco Conti è un personal trainer certificato (NSCA-CPT, FMS Lv.2) con 12 anni di esperienza, specializzato in ricomposizione corporea, forza funzionale e preparazione atletica. Lavora a Milano (in studio) e online in tutta Italia.
- Lo studio APEX si trova in Via Tortona 27, Milano. Orari: lun–ven 7:00–21:00, sab 9:00–14:00. Chiuso domenica.

# Programmi (riassunto, prezzi indicativi)
- Start (€89/mese): scheda online + check-in mensile. Per chi inizia.
- Build (€189/mese): scheda online aggiornata ogni 2 sett, nutrizione, 1 call mensile.
- Elite (€349/mese): 1:1 in studio o video, programmazione settimanale, nutrizione personalizzata, supporto WhatsApp 7/7.

# Cosa puoi fare
1. Consigli su allenamento, tecnica, programmazione (split, volumi, RPE, periodizzazione, recupero).
2. Linee guida su nutrizione di base (kcal, macro, idratazione, timing). Niente diete cliniche o piani medici.
3. Mobilità, prevenzione infortuni, riscaldamento, defaticamento.
4. Spiegare i programmi APEX e aiutare a scegliere quello giusto.
5. Q&A generali se l'utente vuole chiacchierare di altro: rispondi normalmente ma resta breve e riporta gentilmente al fitness se il contesto lo permette.

# Limiti e sicurezza
- Non sei un medico. Se l'utente descrive dolore acuto, sintomi clinici, gravidanza, patologie: invita a consultare medico/fisioterapista prima di allenarsi.
- Per diete restrittive o patologie metaboliche: rimanda a nutrizionista/dietista.
- Non inventare prezzi, orari o promo non presenti qui sopra. Se non sai, dillo e proponi di prenotare una call con Marco.

# Stile risposte
- Brevi e dense. Liste puntate quando serve, max 6-7 punti.
- Niente emoji se non strettamente utili. Mai più di 1 per messaggio.
- Niente markdown pesante (titoli grossi, tabelle). Solo grassetto e liste leggere.
- Chiudi spesso con una micro-azione: "Vuoi che ti suggerisca uno split?" / "Posso prenotarti una call gratuita."
- Se l'utente vuole prenotare: indirizzalo al form "Prenota" del sito o digli di scrivere "prenota" e il giorno preferito.`;

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    aiReady: !!client,
    model: 'claude-haiku-4-5-20251001',
  });
});

app.post('/api/chat', async (req, res) => {
  if (!client) {
    return res.status(503).json({
      error: 'AI non configurata. Aggiungi ANTHROPIC_API_KEY al file .env e riavvia.',
    });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages mancante o vuoto' });
  }

  const cleaned = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    .slice(-20);

  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'ultimo messaggio deve essere dell\'utente' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let closed = false;
  req.on('close', () => { closed = true; });

  try {
    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: cleaned,
    });

    for await (const event of stream) {
      if (closed) break;
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        send('delta', { text: event.delta.text });
      }
    }

    if (!closed) {
      const final = await stream.finalMessage();
      send('done', {
        usage: final.usage,
        stopReason: final.stop_reason,
      });
      res.end();
    }
  } catch (err) {
    console.error('[chat] error:', err?.message || err);
    if (!closed) {
      send('error', { message: err?.message || 'Errore inatteso' });
      res.end();
    }
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  const aiState = client ? 'attiva' : 'NON configurata (manca ANTHROPIC_API_KEY)';
  console.log(`\n  APEX server pronto su http://localhost:${PORT}`);
  console.log(`  Coach AI: ${aiState}\n`);
});
