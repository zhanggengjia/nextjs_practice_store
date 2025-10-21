'use client';
import React from 'react';
import ThemeProvider from './theme-provider';
import { Toaster } from '@/components/ui/sonner';

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster />
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="system"
        enableSystem
        // disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </>
  );
}

export default Providers;
