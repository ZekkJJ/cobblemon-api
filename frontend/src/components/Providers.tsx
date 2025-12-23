'use client';

import { ReactNode } from 'react';
import { AudioProvider } from '@/src/lib/audio-context';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Componente Providers para envolver la aplicación con contextos necesarios
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    <AudioProvider>
      {children}
    </AudioProvider>
  );
}
