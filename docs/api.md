# API `core/`

Публичный интерфейс ядра. Полный справочник с сигнатурами и типами
генерируется TypeDoc из TSDoc-комментариев в [`docs/api/`](api/) командой

```sh
make shell
pnpm docs:api
```

Этот файл — вводная часть: что где лежит, какие инварианты обязаны
выполняться и в каком порядке всё вызывается. Она написана руками, потому что
генератор не знает, зачем существует функция.

Все примеры ниже компилируются: `pnpm docs:check` вытаскивает каждый блок кода
из документации и прогоняет через `tsc --noEmit`.

---

## Карта модулей

| Модуль | Отвечает за |
|---|---|
| [`core/params`](../src/core/params.ts) | схема параметров, дефолты, пресеты, URL-кодек, санитизация |
| [`core/profile`](../src/core/profile.ts) | суперэллипс, ресемплинг, гофр, стопка сечений |
| [`core/mesh`](../src/core/mesh.ts) | триангуляция стопки, объём, площадь, bbox |
| [`core/shell`](../src/core/shell.ts) | тонкостенная модель с дренажом и щелями |
| [`core/polygon`](../src/core/polygon.ts) | триангуляция многоугольника с отверстиями |
| [`core/build`](../src/core/build.ts) | диспетчер по режиму |
| [`core/stl`](../src/core/stl.ts) | чтение и запись binary STL |
| [`core/metrics`](../src/core/metrics.ts) | объём, масса, время, шаг вложения |
| [`core/validate`](../src/core/validate.ts) | правила печатаемости |
| [`core/slicer`](../src/core/slicer.ts) | сводка настроек слайсера |
| [`core/drainage`](../src/core/drainage.ts) | раскладка дренажных отверстий |

---

## Типичный вызов

Полный путь от параметров до файла:

```ts
import { DEFAULT_PARAMS, stlFileName } from '@core/params';
import { buildMesh } from '@core/build';
import { computeMetrics } from '@core/metrics';
import { validate, isPrintable } from '@core/validate';
import { writeBinarySTL } from '@core/stl';

const params = { ...DEFAULT_PARAMS, height: 120, flutes: 36 };

const metrics = computeMetrics(params);
const warnings = validate(params, metrics);

if (isPrintable(warnings)) {
  const mesh = buildMesh(params);
  const file: ArrayBuffer = writeBinarySTL(mesh);
  const name: string = stlFileName(params);
  void file;
  void name;
}
```

Порядок не случайный: `validate` принимает уже посчитанные метрики, чтобы не
строить кольца дважды, а `buildMesh` — самая дорогая операция, и запускать её
до проверки бессмысленно.

---

## Инварианты

Их нарушение — баг ядра, а не пользовательская ошибка.

### Параметры

- Всё, что возвращает `sanitizeParams`, лежит в границах схемы и выровнено по
  шагу. Любой вход из внешнего мира (URL, JSON, localStorage) обязан пройти
  через неё.
- `PARAM_SCHEMA` покрывает ровно все числовые поля `Params` — ни больше, ни
  меньше. Это проверяется тестом.

```ts
import { sanitizeParams, PARAM_SCHEMA } from '@core/params';

const p = sanitizeParams({ topSize: 1e6, flutes: 31 });
console.log(p.topSize === 200, p.flutes === 32);
console.log(PARAM_SCHEMA.every((s) => typeof p[s.key] === 'number'));
```

### Контуры

- Плоский контур — это `Float64Array` вида `[x0, y0, x1, y1, …]`, замкнутый
  неявно (последняя точка соединяется с первой), обход против часовой стрелки
  при взгляде сверху.
- `buildRings` возвращает кольца снизу вверх, `rings[0].z === 0`, у всех колец
  одинаковое число точек.

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildRings } from '@core/profile';

const rings = buildRings(DEFAULT_PARAMS);
console.log(rings[0]!.z === 0);
console.log(new Set(rings.map((r) => r.pts.length)).size === 1);
```

### Меш

- `Mesh` — суп треугольников: `positions` содержит `9 × triangleCount` чисел,
  индексного буфера нет.
- Поверхность замкнута и манифольдна: каждое направленное ребро встречается
  ровно один раз, обратное к нему существует.
- Нормали наружу, то есть `meshVolume(mesh) > 0`.
- Координаты — в миллиметрах, Z вверх, дно на `z = 0`.

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildVaseMesh, meshVolume, meshBounds } from '@core/mesh';

const mesh = buildVaseMesh(DEFAULT_PARAMS);
console.log(mesh.positions.length === mesh.triangleCount * 9);
console.log(meshVolume(mesh) > 0);
console.log(meshBounds(mesh).min[2] === 0);
```

### STL

- Пишется binary, заголовок — 80 нулевых байт (побайтовое совпадение с
  `potgen.py`).
- Нормали граней считаются в double и только потом сужаются до float32 —
  ровно одно округление.
- `parseBinarySTL(writeBinarySTL(m))` возвращает те же вершины с точностью
  float32.

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildVaseMesh } from '@core/mesh';
import { writeBinarySTL, parseBinarySTL } from '@core/stl';

const mesh = buildVaseMesh({ ...DEFAULT_PARAMS, seg: 64, dz: 2 });
const back = parseBinarySTL(writeBinarySTL(mesh));
console.log(back.positions[0] === Math.fround(mesh.positions[0]!));
```

---

## Что бросает исключения

Ядро почти нигде не бросает — параметры приходят уже зажатыми в диапазоны.
Исключения ровно три:

| Функция | Когда | Что делать |
|---|---|---|
| `specOf` | ключа нет в схеме | схема и тип `Params` разошлись — чинить код |
| `triangulateRings` | меньше двух колец | вырожденный ввод, проверить `dz` и `height` |
| `triangulateWithHoles` | отверстие вне контура или самопересечение | геометрия построена неверно |

Воркер ловит всё и отдаёт `{ kind: 'error', message }`, UI показывает это
плашкой — падать целиком приложение не должно.

---

## Производительность

Ориентиры на дефолтных параметрах (256 точек, `dz` 0.5, ~98 тыс. треугольников):

| Операция | Порядок |
|---|---|
| `buildRings` | ~5 мс |
| `triangulateRings` | ~15 мс |
| `writeBinarySTL` | ~20 мс |
| `computeMetrics` | ~6 мс |
| `validate` | микросекунды (метрики передаются готовыми) |

Худший случай (`seg` 1024, `dz` 0.2, высота 250) — секунды и сотни мегабайт,
поэтому меш строится в воркере, а `computeMetrics` работает на кольцах и
остаётся быстрым.
