/**
 * Two-way binding between the parameters and the URL hash.
 *
 * The hash is the whole sharing story: no backend, no short-link service,
 * paste the address and the other side sees the same pot.
 *
 * @module ui/useUrlSync
 */

import { useEffect } from 'react';
import { type Params, decodeParams, encodeParams } from '../core/params';

/**
 * Keeps `window.location.hash` in step with the parameters.
 *
 * Writes use `replaceState`: a slider drag would otherwise push a hundred
 * entries into the browser history and hijack the back button. Undo/redo is
 * the app's own history, and it lives in the store.
 *
 * @param params - current parameters
 * @param setParams - applies parameters arriving from an external hash change
 *
 * @example
 * ```tsx
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { useUrlSync } from '@ui/useUrlSync';
 * function Demo() {
 *   useUrlSync(DEFAULT_PARAMS, () => {});
 *   return null;
 * }
 * ```
 */
export function useUrlSync(params: Params, setParams: (p: Params) => void): void {
  useEffect(() => {
    const payload = encodeParams(params);
    const next = payload ? `#${payload}` : '';
    if (window.location.hash === next) return;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`);
  }, [params]);

  useEffect(() => {
    const onHashChange = (): void => {
      setParams(decodeParams(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [setParams]);
}
