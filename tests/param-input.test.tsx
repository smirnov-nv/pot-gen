// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from '../src/core/params';
import { usePotStore } from '../src/store/usePotStore';
import { ParamPanel } from '../src/ui/ParamPanel';

/**
 * Typing into the numeric fields of the parameter panel.
 *
 * The panel is rendered with the real store wiring, and the fields are driven
 * exactly as a browser drives them: every keystroke appends a character to the
 * *currently rendered* value and fires an `input` event. That round trip is
 * what breaks when a controlled field clamps a half-typed number — the value
 * React writes back becomes the prefix of the next keystroke.
 */

interface Globals {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
}
(globalThis as unknown as Globals).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot> | null = null;

/** Renders the panel bound to the store. */
function mountPanel() {
  usePotStore.setState({ params: { ...DEFAULT_PARAMS }, past: [], future: [] });

  function Bound() {
    const params = usePotStore((s) => s.params);
    const setParam = usePotStore((s) => s.setParam);
    const setShape = usePotStore((s) => s.setShape);
    return <ParamPanel params={params} onChange={setParam} onShapeChange={setShape} />;
  }

  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(<Bound />));
}

/** The number box of the field whose tooltip (schema description) is `title`. */
function numberInput(title: string): HTMLInputElement {
  const label = [...container.querySelectorAll('label')].find(
    (l) => l.getAttribute('title') === title,
  );
  if (!label) throw new Error(`no field with description "${title}"`);
  const input = label.querySelector<HTMLInputElement>('input[type="number"]');
  if (!input) throw new Error(`field "${title}" has no number input`);
  return input;
}

/** Sets `input.value` past React's value tracker, so the change event fires. */
function setValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  act(() => {
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/**
 * Types `text` into the field character by character, the way a keyboard does:
 * each character is appended to the text typed so far.
 *
 * The accumulator is kept here rather than read back from `input.value`,
 * because a `type="number"` box reports "" for text that is not (yet) a valid
 * number — "0." in the browser is on screen but invisible to the value IDL.
 * What must never happen is React writing a *different* number back into the
 * box mid-word; that is what the assertions below check.
 */
function type(input: HTMLInputElement, text: string) {
  let typed = input.value;
  for (const ch of text) {
    typed += ch;
    setValue(input, typed);
    // React re-rendered the box with something else — that is now what the
    // browser shows, and the next character lands after it.
    if (input.value !== '' && input.value !== typed) typed = input.value;
  }
}

/** Selects everything and types over it — the usual "retype this number" gesture. */
function retype(input: HTMLInputElement, text: string) {
  setValue(input, '');
  type(input, text);
}

afterEach(() => {
  // A panel left mounted keeps its store subscription and reacts to the next
  // test's setState outside act().
  if (root) act(() => root!.unmount());
  root = null;
  container?.remove();
});

describe('numeric parameter fields', () => {
  it('accepts a multi-digit number typed from scratch', () => {
    mountPanel();
    retype(numberInput('высота'), '150');

    expect(usePotStore.getState().params.height).toBe(150);
    expect(numberInput('высота').value).toBe('150');
  });

  it('accepts a fractional number while it is still half-typed', () => {
    mountPanel();
    // "0", "0.", "0.7", "0.75" — the middle states must not be rewritten.
    retype(numberInput('диаметр сопла'), '0.75');

    expect(usePotStore.getState().params.nozzle).toBe(0.75);
  });

  it('keeps the value while the field is empty mid-edit', () => {
    mountPanel();
    const input = numberInput('высота');
    setValue(input, '');

    // An empty box is a legitimate intermediate state, not a request for the
    // minimum: the parameter keeps its last value and the box stays empty.
    expect(usePotStore.getState().params.height).toBe(DEFAULT_PARAMS.height);
    expect(numberInput('высота').value).toBe('');
  });

  it('does not snap a number to the step grid while it is being typed', () => {
    mountPanel();
    // flutes has step 4: typing "24" must not turn "2" into "4" first.
    retype(numberInput('число волн гофра, 0 = гладко'), '24');

    expect(usePotStore.getState().params.flutes).toBe(24);
  });

  it('still clamps an out-of-range number once it is committed', () => {
    mountPanel();
    const input = numberInput('высота');
    retype(input, '9999');
    // React delegates onBlur through focusout.
    act(() => {
      input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    });

    expect(usePotStore.getState().params.height).toBe(250);
    // Leaving the field replaces the draft with the value actually stored.
    expect(numberInput('высота').value).toBe('250');
  });

  it('drives the same parameter from the slider', () => {
    mountPanel();
    const label = [...container.querySelectorAll('label')].find(
      (l) => l.getAttribute('title') === 'высота',
    )!;
    const range = label.querySelector<HTMLInputElement>('input[type="range"]')!;
    setValue(range, '180');

    expect(usePotStore.getState().params.height).toBe(180);
  });
});