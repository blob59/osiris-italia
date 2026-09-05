import LumaChat from '@/components/LumaChat';
import LumaNaturalEvents from '@/components/LumaNaturalEvents';
import SourcesToLumaPanel from '@/components/SourcesToLumaPanel';
import LumaMapBridge from '@/components/LumaMapBridge';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        aria-label="Identità OSIRIS Italia"
        className="pointer-events-none fixed right-4 top-4 z-[9999] rounded-md border border-[#D4AF37]/50 bg-[#06060C]/90 px-3 py-2 text-right shadow-lg backdrop-blur"
      >
        <div className="text-[11px] font-semibold tracking-[0.18em] text-[#D4AF37]">
          OSIRIS ITALIA
        </div>
        <div className="mt-0.5 text-[9px] tracking-[0.12em] text-white/70">
          OPEN SOURCE INTELLIGENCE
        </div>
        <div className="mt-1 text-[10px] font-medium text-white/90">
          Luma AI · Gemini
        </div>
      </div>
      {children}
      <LumaMapBridge />
      <LumaNaturalEvents />
      <SourcesToLumaPanel />
      <LumaChat />
    </>
  );
}
