# Разработка

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер Vite с HMR на http://localhost:5173 |
| `npm run build` | проверка типов и production-сборка в `dist/` |
| `npm run preview` | локальный просмотр production-сборки |
| `npm run lint` | Oxlint |
| `npm run lint:fsd` | Steiger — проверка правил Feature-Sliced Design |
| `npm run typecheck` | `tsc -b` |
| `npm test` | Vitest в watch-режиме (`npx vitest run` — однократный прогон) |

## Архитектура

Проект следует [Feature-Sliced Design](https://feature-sliced.design/): слои `app → pages → widgets → features →
entities → shared`, импорты только сверху вниз, каждый слайс отдаёт наружу публичный API через `index.ts`.
Импорты между слоями — через алиас `@/` (указывает на `src/`). Подробнее — в [architecture.md](architecture.md).

## Тестирование

- Разработка ведётся по TDD: тест на модуль пишется до реализации.
- Тесты лежат рядом с модулем: `foo.ts` → `foo.test.ts`.
- Vitest работает в **Browser Mode**: тесты выполняются в настоящем Chromium (Playwright), компоненты
  рендерятся через `vitest-browser-react`. Перед первым запуском нужен браузер: `npx playwright install chromium`.
- Хелперы в [src/shared/lib/test](../src/shared/lib/test):
  - `renderWithMantine(ui)` рендерит компонент внутри `MantineProvider`;
  - `mockGreenApi({ method: handler })` подменяет `fetch` и выбирает ответ по имени метода GREEN-API из URL.
    Обработчик возвращает данные для JSON-ответа или готовый `Response`, например с ошибкой.
- Сторы Zustand сбрасываются перед каждым тестом: `useXStore.setState(useXStore.getInitialState())` и
  `localStorage.clear()`.
- В красной фазе TDD, пока модуля ещё нет, Vite вставляет на страницу оверлей с ошибкой импорта, и тесты
  **соседних** файлов могут падать на поиске элементов. Это пропадает, как только модуль появляется.
  Проверяйте красную фазу точечно: `npx vitest run путь/к/тесту`.

## Линтеры

- **Oxlint** ([.oxlintrc.json](../.oxlintrc.json)) — набор правил, эквивалентный рекомендуемым конфигам
  `@eslint/js`, `typescript-eslint`, `react-hooks` и `react-refresh`.
- **Steiger** ([steiger.config.ts](../steiger.config.ts)) — рекомендуемые правила FSD. Отключено только правило
  `insignificant-slice`: в маленьком приложении у большинства слайсов один потребитель, а делить на слайсы
  мы решили сознательно.

## UI и стили

- Базовые компоненты берутся из [Mantine](https://mantine.dev). Его CSS подключается точечно в
  [src/app/styles/index.css](../src/app/styles/index.css): если используется новый компонент Mantine, туда нужно
  добавить его CSS. Подключаются версии `*.layer.css`, поэтому стили Mantine лежат в `@layer mantine`, а наши
  стили всегда приоритетнее.
- Свои стили пишутся по **БЭМ**: обычный `.css` рядом с компонентом (`ChatListItem.tsx` + `ChatListItem.css`),
  имя блока — имя компонента в kebab-case, классы `блок__элемент--модификатор`, у модификатора-значения вид
  `--ключ_значение`. Модификаторы задаются классами, не data-атрибутами. Классы собирает хелпер `bem()`
  из `@/shared/lib`:

  ```tsx
  const b = bem('chat-list-item')
  <button className={b({ active })}>   // chat-list-item chat-list-item--active
    <div className={b('body')}>        // chat-list-item__body
  ```
- Вклад Mantine в бандл (gzip): JS 68.6 → 81.9 КБ, CSS 0 → 4.7 КБ. Итоговый бандл приложения:
  JS 110 КБ, CSS 12.4 КБ.
- Ссылки на статику — через импорт или `import.meta.env.BASE_URL`: на GitHub Pages приложение живёт
  в подпапке `/message-sender/`, абсолютные пути `/...` там ломаются.

## Деплой

Push в `main` запускает [workflow](../.github/workflows/deploy.yml):

```
npm ci → Oxlint → Steiger → typecheck → тесты (Chromium) → сборка → публикация на GitHub Pages
```

Если любой шаг падает, деплой не выполняется. Сайт: https://anrb13.github.io/message-sender/.
Один раз в настройках репозитория нужно выбрать Settings → Pages → Source: **GitHub Actions**.

## Соглашения

- Комментарии в коде — на русском, там где логика неочевидна.
- Один логический шаг — один коммит (Conventional Commits: `feat:`, `test:`, `chore:`, `docs:`, `ci:`).
