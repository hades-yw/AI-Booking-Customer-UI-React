import { useCallback, useEffect, useState } from 'react';
import { paymentApi } from '../api/httpClient';
import type { CheckoutOptions } from '../api/httpClient';

export const BOOKING_UNAVAILABLE = 'Online booking is temporarily unavailable. Please contact the business directly.';

export function useBookingAvailability(slug?: string) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ slug?: string; options: CheckoutOptions | null; loading: boolean; failed: boolean }>({ options: null, loading: true, failed: false });
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    if (!slug) return;
    let live = true;
    let request = 0;
    async function check() {
      const id = ++request;
      setState(previous => ({ slug, options: previous.slug === slug ? previous.options : null, loading: true, failed: false }));
      try {
        const options = await paymentApi.options(slug!);
        if (live && request === id) setState({ slug, options, loading: false, failed: false });
      } catch {
        if (live && request === id) setState({ slug, options: null, loading: false, failed: true });
      }
    }
    void check();
    window.addEventListener('focus', check);
    return () => { live = false; window.removeEventListener('focus', check); };
  }, [slug, version]);
  const current = state.slug === slug ? state : { options: null, loading: true, failed: false };
  const available = !current.loading && !current.failed && !!current.options && current.options.booking_available !== false && current.options.options.length > 0;
  const message = current.loading ? 'Checking online booking availability…' : current.failed ? 'Unable to check online booking availability. Please try again.' : available ? null : BOOKING_UNAVAILABLE;
  return { options: current.options, available, loading: current.loading, failed: current.failed, message, refresh };
}
