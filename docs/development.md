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
- Вклад Mantine в бандл (gzip): JS 68.6 → 81.9 КБ, CSS 0 → 4.7 КБ.
- Ссылки на статику — через импорт или `import.meta.env.BASE_URL`: на GitHub Pages приложение живёт
  в подпапке `/message-sender/`, абсолютные пути `/...` там ломаются.

## Деплой

Push в `main` запускает [workflow](../.github/workflows/deploy.yml): lint → тесты → сборка → публикация на
GitHub Pages (https://anrb13.github.io/message-sender/).

## Соглашения

- Комментарии в коде — на русском, там где логика неочевидна.
- Один логический шаг — один коммит (Conventional Commits: `feat:`, `test:`, `chore:`, `docs:`, `ci:`).
