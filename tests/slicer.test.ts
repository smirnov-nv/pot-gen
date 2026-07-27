import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from '../src/core/params';
import { hintsToText, slicerHints } from '../src/core/slicer';

describe('slicerHints', () => {
  it('turns spiral vase on in vase mode and off in shell mode', () => {
    const vase = slicerHints(DEFAULT_PARAMS)[0]!;
    expect(vase.label).toMatch(/Spiral vase/);
    expect(vase.value).toBe('включить');

    const shell = slicerHints({ ...DEFAULT_PARAMS, mode: 'shell' })[0]!;
    expect(shell.value).toBe('выключить');
  });

  it('quotes the parameters actually in use', () => {
    const text = hintsToText(slicerHints({ ...DEFAULT_PARAMS, layerH: 0.2, speed: 90 }));
    expect(text).toContain('0.2 мм');
    expect(text).toContain('90 мм/с');
  });

  it('covers everything SPEC section 7.6 asks for', () => {
    const text = hintsToText(slicerHints(DEFAULT_PARAMS));
    for (const needle of ['Ширина линии', 'Высота слоя', 'Слоёв дна', '245–250', 'Обдув', 'Скорость', 'Брим']) {
      expect(text, needle).toContain(needle);
    }
  });

  it('explains the fan setting instead of just stating it', () => {
    const fan = slicerHints(DEFAULT_PARAMS).find((h) => h.label === 'Обдув');
    expect(fan?.why).toMatch(/адгези/);
  });

  it('says one object per plate in vase mode, many in shell mode', () => {
    const vase = slicerHints(DEFAULT_PARAMS).find((h) => h.label === 'Объектов на столе');
    expect(vase?.value).toBe('1');
    const shell = slicerHints({ ...DEFAULT_PARAMS, mode: 'shell' }).find(
      (h) => h.label === 'Объектов на столе',
    );
    expect(shell?.value).not.toBe('1');
  });

  it('derives the shell wall count from thickness and line width', () => {
    const hints = slicerHints({ ...DEFAULT_PARAMS, mode: 'shell', wallThickness: 1.5, wallWidth: 0.75 });
    expect(hints.find((h) => h.label === 'Стенок / заполнение')?.value).toBe('2 / 0 %');
  });

  it('renders one line per hint', () => {
    const hints = slicerHints(DEFAULT_PARAMS);
    expect(hintsToText(hints).split('\n')).toHaveLength(hints.length);
  });
});
