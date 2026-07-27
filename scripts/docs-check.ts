/**
 * Compiles every code example in the documentation.
 *
 * Examples rot faster than prose: a renamed export leaves the text looking
 * plausible and the snippet broken. This extracts every fenced `ts`/`tsx`
 * block from the markdown *and* from the TSDoc `@example` blocks in `src/`,
 * writes them into a scratch project and runs `tsc --noEmit` over the lot.
 *
 * Usage: `pnpm docs:check` (inside the container).
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, '.docs-check');

/** Every file under `dir` matching `test`. */
function walk(dir: string, test: (name: string) => boolean): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, test));
    else if (test(entry)) out.push(full);
  }
  return out;
}

interface Snippet {
  source: string;
  lang: 'ts' | 'tsx';
  code: string;
}

/** Fenced ts/tsx blocks in a markdown document. */
function fromMarkdown(file: string): Snippet[] {
  const out: Snippet[] = [];
  const text = readFileSync(file, 'utf8');
  const re = /```(tsx?)\n([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    out.push({ source: relative(ROOT, file), lang: m[1] as 'ts' | 'tsx', code: m[2]! });
  }
  return out;
}

/** Fenced blocks inside TSDoc comments of a source file. */
function fromSource(file: string): Snippet[] {
  const out: Snippet[] = [];
  const text = readFileSync(file, 'utf8');
  const re = /\/\*\*[\s\S]*?\*\//g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    // Strip the leading " * " of every comment line, then look for fences.
    const body = m[0]
      .split('\n')
      .map((line) => line.replace(/^\s*\/?\*+\/?/, '').replace(/^ /, ''))
      .join('\n');
    const fence = /```(tsx?)\n([\s\S]*?)```/g;
    let f: RegExpExecArray | null;
    while ((f = fence.exec(body))) {
      out.push({ source: relative(ROOT, file), lang: f[1] as 'ts' | 'tsx', code: f[2]! });
    }
  }
  return out;
}

const snippets: Snippet[] = [
  ...walk(join(ROOT, 'docs'), (n) => n.endsWith('.md')).flatMap(fromMarkdown),
  ...fromMarkdown(join(ROOT, 'README.md')),
  ...walk(join(ROOT, 'src'), (n) => n.endsWith('.ts') || n.endsWith('.tsx')).flatMap(fromSource),
];

if (snippets.length === 0) throw new Error('ни одного примера не найдено — проверьте пути');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

snippets.forEach((snippet, i) => {
  const name = `snippet-${String(i).padStart(3, '0')}.${snippet.lang}`;
  // Wrapping in a module keeps snippets from colliding on top-level names.
  writeFileSync(join(OUT, name), `// from ${snippet.source}\nexport {};\n${snippet.code}`);
});

writeFileSync(
  join(OUT, 'tsconfig.json'),
  JSON.stringify(
    {
      extends: '../tsconfig.json',
      compilerOptions: {
        baseUrl: '..',
        noUnusedLocals: false,
        noUnusedParameters: false,
        paths: {
          '@core/*': ['src/core/*'],
          '@ui/*': ['src/ui/*'],
          '@store/*': ['src/store/*'],
        },
      },
      include: ['./*.ts', './*.tsx'],
    },
    null,
    2,
  ),
);

console.log(`docs:check — компилирую ${snippets.length} примеров`);
try {
  execFileSync('node', [join(ROOT, 'node_modules/typescript/bin/tsc'), '--noEmit', '-p', join(OUT, 'tsconfig.json')], {
    stdio: 'inherit',
  });
} catch {
  console.error('docs:check — примеры не компилируются, см. ошибки выше');
  process.exit(1);
}
rmSync(OUT, { recursive: true, force: true });
console.log('docs:check — все примеры компилируются');
