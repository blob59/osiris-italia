'use client';

export default function OsirisItaliaSignature() {
  return (
    <div className="pointer-events-none fixed bottom-2 left-1/2 z-[55] -translate-x-1/2 px-3 py-1.5 rounded-full border border-white/10 bg-black/45 backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.12em] text-white/75">
        <span className="font-semibold text-white/90">OSIRIS ITALIA</span>
        <span className="text-white/30">•</span>
        <span>by Franco Ficara</span>
        <span className="text-white/30">•</span>
        <span className="text-[var(--gold-primary)]">AI Luma</span>
      </div>
    </div>
  );
}
