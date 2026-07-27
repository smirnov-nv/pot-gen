/**
 * Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z (or Ctrl+Y) for parameter history.
 *
 * @module ui/useUndoShortcuts
 */

import { useEffect } from 'react';

/**
 * Binds the undo/redo keyboard shortcuts to the document.
 *
 * Keystrokes are ignored while a text or number field has focus, so typing a
 * value and correcting it with Ctrl+Z still behaves the way the browser does.
 *
 * @param undo - called on Ctrl/Cmd+Z
 * @param redo - called on Ctrl/Cmd+Shift+Z and Ctrl+Y
 *
 * @example
 * ```tsx
 * import { useUndoShortcuts } from '@ui/useUndoShortcuts';
 * function Demo() {
 *   useUndoShortcuts(() => {}, () => {});
 *   return null;
 * }
 * ```
 */
export function useUndoShortcuts(undo: () => void, redo: () => void): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);
}
