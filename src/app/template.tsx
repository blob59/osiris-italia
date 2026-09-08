'use client';

import type { ReactNode } from 'react';
import LumaChat from '@/components/LumaChat';
import OsirisItaliaSignature from '@/components/OsirisItaliaSignature';

export default function Template({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <OsirisItaliaSignature />
      <div className="osiris-italia-luma-large">
        <LumaChat />
      </div>
      <style jsx global>{`
        .osiris-italia-luma-large button[aria-label*="Luma"],
        .osiris-italia-luma-large button[title*="Luma"] {
          transform: scale(1.18);
          transform-origin: bottom right;
        }
      `}</style>
    </>
  );
}
