/**
 * Regenerates the parameter table in README.md from PARAM_SCHEMA.
 *
 * The table is markers-delimited; everything between them is replaced. Having
 * it generated is the only way it stays in step with the schema — a
 * hand-maintained copy is out of date the first time a range changes.
 *
 * Usage: `pnpm docs:params` (inside the container).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_PARAMS,
  GROUP_TITLES,
  PARAM_SCHEMA,
  type ParamGroup,
} from '../src/core/params';

const README = fileURLToPath(new URL('../README.md', import.meta.url));
const BEGIN = '<!-- BEGIN PARAMS -->';
const END = '<!-- END PARAMS -->';

const GROUP_ORDER: ParamGroup[] = ['shape', 'flute', 'rim', 'mesh', 'print', 'shell', 'tray'];

function table(): string {
  const lines: string[] = [];
  for (const group of GROUP_ORDER) {
    const specs = PARAM_SCHEMA.filter((s) => s.group === group);
    if (specs.length === 0) continue;
    lines.push(`#### ${GROUP_TITLES[group]}`, '');
    lines.push('| Параметр | Единица | Дефолт | Диапазон | Шаг | Описание |');
    lines.push('|---|---|---|---|---|---|');
    for (const spec of specs) {
      lines.push(
        `| \`${spec.key}\` | ${spec.unit || '—'} | ${DEFAULT_PARAMS[spec.key]} | ` +
          `${spec.min}…${spec.max} | ${spec.step} | ${spec.description} |`,
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

const readme = readFileSync(README, 'utf8');
const begin = readme.indexOf(BEGIN);
const end = readme.indexOf(END);
if (begin < 0 || end < 0) {
  throw new Error(`README.md must contain ${BEGIN} and ${END} markers`);
}

const next = `${readme.slice(0, begin + BEGIN.length)}\n<!-- Сгенерировано: pnpm docs:params. Руками не править. -->\n\n${table()}${readme.slice(end)}`;

if (next !== readme) {
  writeFileSync(README, next);
  console.log('README.md: таблица параметров обновлена');
} else {
  console.log('README.md: таблица параметров актуальна');
}
