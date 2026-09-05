'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';

export default function OsirisItaliaAbout() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-2 right-3 z-[56] flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-2.5 py-1.5 text-[10px] font-mono tracking-[0.08em] text-white/70 backdrop-blur-md transition hover:text-white"
        title="Informazioni su OSIRIS Italia"
      >
        <Info className="h-3 w-3" />
        INFO
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <section
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#090d12]/95 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono tracking-[0.22em] text-[var(--gold-primary)]">OSIRIS ITALIA</div>
                <h2 className="mt-1 text-lg font-semibold text-white">Progetto di Franco Ficara</h2>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white" aria-label="Chiudi">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm leading-relaxed text-white/70">
              <p>Versione italiana personalizzata della piattaforma open-source OSIRIS, con interfaccia, integrazioni e funzioni dedicate al contesto italiano ed europeo.</p>
              <p><span className="text-white/45">Ideazione e personalizzazione:</span> <strong className="font-medium text-white/90">Franco Ficara</strong></p>
              <p><span className="text-white/45">Assistente AI:</span> <strong className="font-medium text-[var(--gold-primary)]">Luma</strong></p>
              <p className="border-t border-white/10 pt-3 text-xs text-white/45">Basato sul progetto open-source OSIRIS. Licenza e attribuzioni del progetto originale restano preservate nel repository.</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
