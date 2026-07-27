# Как это расширять

Три сценария, которые возникают первыми: новый тип сечения, новое правило
валидации, новый формат экспорта. Каждый — с рабочим кодом; все примеры
компилируются в `pnpm docs:check`.

---

## 1. Новый тип сечения

Сейчас сечение всегда суперэллипс. Добавим шестиугольник и овал.

### 1.1 Функция контура

Контракт: вернуть `Float64Array` вида `[x, y, …]`, обход против часовой
стрелки, замкнутость неявная. Плотную выборку потом всё равно пересэмплируют
по длине дуги, так что равномерность по параметру не нужна.

```ts
/** Правильный n-угольник, вписанный в окружность радиуса a. */
export function polygonSection(a: number, sides: number, n = 720): Float64Array {
  const out = new Float64Array(n * 2);
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    // Радиус многоугольника как функция угла: расстояние до стороны.
    const sector = (2 * Math.PI) / sides;
    const half = sector / 2;
    const r = (a * Math.cos(half)) / Math.cos(((t % sector) + sector) % sector - half);
    out[i * 2] = r * Math.cos(t);
    out[i * 2 + 1] = r * Math.sin(t);
  }
  return out;
}

/** Овал с отношением сторон ratio. */
export function ovalSection(a: number, ratio: number, n = 720): Float64Array {
  const out = new Float64Array(n * 2);
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    out[i * 2] = a * Math.cos(t);
    out[i * 2 + 1] = a * ratio * Math.sin(t);
  }
  return out;
}
```

### 1.2 Подключение

`baseProfile` в [`core/profile.ts`](../src/core/profile.ts) жёстко зовёт
`superellipse`. Заведите тип сечения и диспетчер:

```ts
import { resampleByArcLength, superellipse } from '@core/profile';
// из блока выше
declare function polygonSection(a: number, sides: number, n?: number): Float64Array;
declare function ovalSection(a: number, ratio: number, n?: number): Float64Array;

export type SectionKind = 'superellipse' | 'hexagon' | 'oval';

export function sectionContour(
  kind: SectionKind,
  half: number,
  cornerR: number,
  seg: number,
): Float64Array {
  switch (kind) {
    case 'hexagon':
      return resampleByArcLength(polygonSection(half, 6), seg);
    case 'oval':
      return resampleByArcLength(ovalSection(half, 0.7), seg);
    case 'superellipse':
    default:
      return resampleByArcLength(superellipse(half, cornerR), seg);
  }
}
```

Дальше `baseProfile` вызывает `sectionContour` вместо `superellipse`, а гофр
накладывается поверх без изменений — он работает с любым контуром, потому что
нормаль считается из самих точек.

### 1.3 Чего не забыть

- **Параметр в схему.** `section` не число, поэтому по образцу `mode` он
  добавляется в `Params`, в `sanitizeParams` и в `encodeParams` руками —
  `PARAM_SCHEMA` описывает только числовые поля.
- **Golden-тесты.** Дефолт обязан остаться `superellipse`, иначе фикстуры
  перестанут сходиться. Это фича: они и должны ловить такое.
- **Симметрия гофра.** Правило «`flutes` кратно 4» верно для четырёхкратной
  симметрии квадрата. Для шестиугольника кратность должна быть 6, для овала —
  2. Если добавляете сечения, шаг слайдера `flutes` тоже становится функцией
  от типа сечения.
- **Вложение.** `nestingPitch` работает с огибающей радиуса и к типу сечения
  безразличен — трогать не надо.

---

## 2. Новое правило валидации

Правила живут в [`core/validate.ts`](../src/core/validate.ts) одной функцией.
Добавление — один блок:

```ts
import type { Metrics } from '@core/metrics';
import type { Params } from '@core/params';
import type { Warning } from '@core/validate';

/** Пример: слишком высокий горшок для своего дна — опрокинется. */
export function checkTipping(params: Params, metrics: Metrics): Warning[] {
  const ratio = params.height / params.bottomSize;
  if (ratio <= 2.5) return [];
  return [
    {
      id: 'tipping',
      level: 'warning',
      text:
        `Высота ${params.height} мм при дне ${params.bottomSize} мм ` +
        `(отношение ${ratio.toFixed(1)}) — горшок с влажным грунтом опрокинется. ` +
        `Расширьте дно или срежьте высоту. Объём при этом потеряете небольшой: ` +
        `сейчас ${metrics.usableVolumeL.toFixed(2)} л.`,
    },
  ];
}
```

Требования к правилу:

1. **`id` стабилен** — он используется как ключ React и в тестах.
2. **Текст объясняет причину**, а не констатирует факт. «Отношение 3.2» —
   мусор; «опрокинется с влажным грунтом» — правило, которое чему-то учит.
3. **Уровень честный.** `error` — не напечатается или напечатается мусором.
   `warning` — напечатается, но будет хуже. `info` — это выбор, а не проблема
   (как `twist`).
4. **Тест на обе стороны.** В `tests/validate.test.ts` проверяются и
   срабатывание, и молчание на дефолтах:

```ts
import { expect, it } from 'vitest';
import { DEFAULT_PARAMS } from '@core/params';
import { validate } from '@core/validate';

it('молчит на дефолтах', () => {
  expect(validate(DEFAULT_PARAMS).map((w) => w.id)).not.toContain('tipping');
});
```

Если правилу нужна величина, которой нет в `Metrics`, добавьте её в
`computeMetrics` — валидатор не должен считать геометрию сам.

---

## 3. Новый формат экспорта

### 3.1 OBJ

Простейший случай: текстовый формат, вершины и грани.

```ts
import type { Mesh } from '@core/mesh';

/** Mesh -> OBJ. Вершины не дедуплицируются: суп треугольников как есть. */
export function writeOBJ(mesh: Mesh, name = 'pot'): string {
  const lines: string[] = [`# ${name}`, `o ${name}`];
  const p = mesh.positions;

  for (let i = 0; i < p.length; i += 3) {
    lines.push(`v ${p[i]!.toFixed(4)} ${p[i + 1]!.toFixed(4)} ${p[i + 2]!.toFixed(4)}`);
  }
  for (let t = 0; t < mesh.triangleCount; t++) {
    const a = t * 3 + 1; // OBJ индексирует с единицы
    lines.push(`f ${a} ${a + 1} ${a + 2}`);
  }
  return lines.join('\n');
}
```

Дедупликация вершин уменьшила бы файл примерно втрое; если это нужно,
собирайте `Map<string, number>` по округлённым до 1e-6 координатам — тем же
приёмом, что тест манифольдности.

### 3.2 3MF

3MF — это ZIP с XML внутри, и это единственная сложность: нужен архиватор.
Минимальный контейнер — `[Content_Types].xml`, `_rels/.rels` и
`3D/3dmodel.model`. Модельная часть:

```ts
import type { Mesh } from '@core/mesh';

/** Содержимое 3D/3dmodel.model для 3MF. */
export function model3MF(mesh: Mesh): string {
  const p = mesh.positions;
  const vertices: string[] = [];
  const triangles: string[] = [];

  for (let i = 0; i < p.length; i += 3) {
    vertices.push(`<vertex x="${p[i]}" y="${p[i + 1]}" z="${p[i + 2]}"/>`);
  }
  for (let t = 0; t < mesh.triangleCount; t++) {
    const a = t * 3;
    triangles.push(`<triangle v1="${a}" v2="${a + 1}" v3="${a + 2}"/>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
  <resources>
    <object id="1" type="model">
      <mesh>
        <vertices>${vertices.join('')}</vertices>
        <triangles>${triangles.join('')}</triangles>
      </mesh>
    </object>
  </resources>
  <build><item objectid="1"/></build>
</model>`;
}
```

Единицы в 3MF объявляются явно (`unit="millimeter"`) — в отличие от STL, где
их нет вовсе и все просто договорились считать миллиметры.

### 3.3 Подключение к воркеру

Экспорт идёт через воркер, чтобы не морозить UI на больших мешах. Добавьте
вид работы в [`worker/protocol.ts`](../src/worker/protocol.ts):

```ts
import type { Params } from '@core/params';

export type RequestKind = 'mesh' | 'stl' | 'obj';

export interface WorkerRequest {
  id: number;
  kind: RequestKind;
  params: Params;
}
```

затем ветку в `mesh.worker.ts`, метод в `useMeshWorker` рядом с `requestSTL` и
кнопку в шапке. Текстовые форматы отдавайте как `Blob` со строкой, бинарные —
как transferable `ArrayBuffer`.

---

## 4. Общие правила

- **`core/` остаётся чистым.** Ни React, ни three.js, ни `window`. Всё, что
  умеет считать без DOM, тестируется в node-окружении и работает в воркере.
- **Новый параметр — только через `PARAM_SCHEMA`.** Оттуда его сами подхватят
  панель, таблица в README и URL-кодек. Захардкоженный слайдер рассинхронится
  в первый же день.
- **Меняете геометрию — смотрите на golden-тесты.** Они падают именно тогда,
  когда должны: дефолтная форма изменилась. Перегенерировать фикстуры можно
  только если менялся сам `potgen.py`.
- **Комментарий объясняет «почему».** «Цикл по точкам» не нужен никому; «этот
  отступ учитывает амплитуду гофра, иначе в ложбинах остаётся бумага» — нужен.
