'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { MessageCircle, Send, X, Sparkles, Loader2, MapPin } from 'lucide-react';
import { LUMA_CONTEXT_EVENT, type LumaUiContext } from '@/lib/luma-context';

type ChatMessage = { role: 'user' | 'luma'; text: string };

const QUICK_PROMPTS = [
  'Cosa sto guardando adesso?',
  'Riassumimi questa zona',
  'Quali dati devo controllare prima di trarre conclusioni?',
];

function emptyIntelligenceContext() {
  return {
    earthquakes: [],
    news: [],
    threats: [],
    cyberAlerts: [],
    timestamp: new Date().toISOString(),
  };
}

export default function LumaChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uiContext, setUiContext] = useState<LumaUiContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'luma',
      text: 'Ciao, sono Luma. Posso aiutarti a leggere e interpretare i dati OSINT di OSIRIS Italia. Se un dato non è disponibile, te lo dirò senza inventarlo.',
    },
  ]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<LumaUiContext>;
      if (custom.detail) setUiContext(custom.detail);
    };
    window.addEventListener(LUMA_CONTEXT_EVENT, handler as EventListener);
    return () => window.removeEventListener(LUMA_CONTEXT_EVENT, handler as EventListener);
  }, []);

  const contextLabel = useMemo(() => {
    if (!uiContext) return 'Nessun contesto selezionato';
    return uiContext.label;
  }, [uiContext]);

  async function askLuma(question: string) {
    const query = question.trim();
    if (!query || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setInput('');
    setLoading(true);

    const contextualQuery = uiContext
      ? `${query}\n\nCONTESTO INTERFACCIA OSIRIS ITALIA:\n${JSON.stringify(uiContext, null, 2)}\nUsa questo contesto come dato osservato dell'interfaccia, senza inventare elementi non presenti.`
      : query;

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: contextualQuery,
          context: emptyIntelligenceContext(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const friendly = data?.code === 'NO_API_KEY'
          ? 'Luma è pronta, ma manca ancora la chiave API Gemini sul server. Appena la configuriamo potrò rispondere direttamente qui.'
          : `Non riesco a rispondere in questo momento: ${data?.error ?? 'errore del servizio AI'}`;
        setMessages((prev) => [...prev, { role: 'luma', text: friendly }]);
        return;
      }

      setMessages((prev) => [...prev, { role: 'luma', text: data.analysis || 'Non ho ricevuto una risposta utile da Gemini.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'luma', text: 'Non riesco a raggiungere il servizio AI. Riprova tra poco.' }]);
    } finally {
      setLoading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void askLuma(input);
  }

  return (
    <div className="fixed bottom-4 right-4 z-[10000] pointer-events-auto font-mono">
      {open ? (
        <div className="w-[min(92vw,390px)] h-[min(72vh,590px)] rounded-xl border border-[#D4AF37]/45 bg-[#07080d]/95 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-[#D4AF37]/50 flex items-center justify-center bg-[#D4AF37]/10">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Luma</div>
                <div className="text-[10px] text-white/55">Assistente AI · Gemini</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-white/10 text-white/60" aria-label="Chiudi Luma">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3 py-2 border-b border-white/10 bg-[#D4AF37]/[0.04] flex items-center gap-2">
            <MapPin className="w-3 h-3 text-[#D4AF37]" />
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.12em] text-white/35">Contesto attivo</div>
              <div className="text-[10px] text-white/70 truncate">{contextLabel}</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[86%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-white' : 'bg-white/[0.06] border border-white/10 text-white/85'}`}>
                  {message.text}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div className="space-y-1.5 pt-1">
                {QUICK_PROMPTS.map((prompt) => (
                  <button key={prompt} onClick={() => void askLuma(prompt)} className="block w-full text-left text-[10px] rounded-md border border-white/10 px-2.5 py-2 text-white/60 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors">
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-[11px] text-white/50">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Luma sta analizzando…
              </div>
            )}
          </div>

          <form onSubmit={submit} className="border-t border-white/10 p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={uiContext ? `Chiedi a Luma di ${uiContext.label}…` : 'Chiedi a Luma…'}
              className="flex-1 min-w-0 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-[#D4AF37]/50 placeholder:text-white/30"
            />
            <button disabled={loading || !input.trim()} className="w-9 h-9 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center disabled:opacity-40" aria-label="Invia a Luma">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="group flex items-center gap-2 rounded-full border border-[#D4AF37]/50 bg-[#07080d]/95 px-4 py-3 shadow-xl backdrop-blur hover:border-[#D4AF37] transition-colors" aria-label="Apri Luma">
          <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-xs font-semibold text-white">Chiedi a Luma</span>
          {uiContext && <span className="w-2 h-2 rounded-full bg-emerald-400" title={`Contesto: ${uiContext.label}`} />}
        </button>
      )}
    </div>
  );
}
