import { createContext, useContext, useCallback, type ReactNode } from 'react';

interface AnalyticsContextValue {
  trackEvent: (category: string, action: string, label?: string) => void;
  trackPageView: (page: string) => void;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  trackEvent: () => {},
  trackPageView: () => {},
});

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const trackEvent = useCallback((category: string, action: string, label?: string) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
      });
    }
  }, []);

  const trackPageView = useCallback((page: string) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: page });
    }
  }, []);

  return (
    <AnalyticsContext.Provider value={{ trackEvent, trackPageView }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextValue {
  return useContext(AnalyticsContext);
}
