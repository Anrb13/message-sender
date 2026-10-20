# Интеграция с GREEN-API

Приложение работает с GREEN-API напрямую из браузера. API отдаёт `Access-Control-Allow-Origin: *`, поэтому
ни бэкенд, ни прокси не нужны. Код интеграции лежит в [src/shared/api/green-api](../src/shared/api/green-api).

## Формат запросов

```
{apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}
```

`apiUrl` указан в личном кабинете. На форме входа он подставляется по первым 4 цифрам `idInstance`
(`3100123456` → `https://3100.api.green-api.com`), см. [api-url.ts](../src/shared/lib/api-url.ts).

## Используемые методы

| Метод | HTTP | Зачем |
|---|---|---|
| `getStateInstance` | GET | проверка учётных данных при входе (`authorized`) |
| `getSettings` / `setSettings` | GET / POST | проверка и включение уведомлений. `setSettings` перезапускает инстанс |
| `checkAccount` | POST | MAX, Telegram: номер → `chatId` |
| `checkWhatsapp` | POST | WhatsApp: есть ли аккаунт у номера, `@lid`-идентификатор |
| `sendMessage` | POST | отправка текста, ответ `{ idMessage }` |
| `receiveNotification` | GET | long polling входящих уведомлений, `?receiveTimeout=5..60` |
| `deleteNotification` | DELETE | удаление обработанного уведомления: `/{receiptId}` |

Клиент — [client.ts](../src/shared/api/green-api/client.ts):

- `createGreenApiClient(credentials)` возвращает объект с методами.
- Пустое тело ответа (так выглядит пустая очередь у `receiveNotification`) превращается в `null`.
- HTTP-ошибки бросаются как `GreenApiError` со `status`. `status = 0` значит, что запрос не дошёл до сервера
  или истёк таймаут (поле `timeout` отличает одно от другого).
- Ответ `200` с `{ "status": false, "reason": "…" }` превращается в `GreenApiRejectError`: так GREEN-API
  сообщает, что инстанс не авторизован, ещё запускается или исчерпан лимит проверок номеров. Без этого
  `checkAccount` выглядел бы как «номера нет в мессенджере».
- `AbortError` пробрасывается как есть, чтобы цикл polling можно было остановить.
- У каждого запроса есть таймаут: 30 с у обычных методов и `receiveTimeout + 15` с у `receiveNotification`
  (сервер сам держит long polling открытым до `receiveTimeout` секунд).

## Различия мессенджеров: адаптеры

Методы и формат уведомлений у MAX, Telegram и WhatsApp общие. Различия собраны в адаптерах
([adapters/](../src/shared/api/green-api/adapters)), которые реализуют `MessengerAdapter`:

| | MAX | Telegram | WhatsApp |
|---|---|---|---|
| Номер → chatId | `checkAccount` | `checkAccount` | `checkWhatsapp` |
| Формат chatId | числовая строка | числовая строка | `…@c.us` / `…@lid` |
| `typeInstance` | `v3` | `telegram` | `whatsapp` |

Реализации:

- [check-account.ts](../src/shared/api/green-api/adapters/check-account.ts) — общий адаптер для MAX и
  Telegram: `checkAccount {phoneNumber}` → `{exist, chatId}`.
- [whatsapp.ts](../src/shared/api/green-api/adapters/whatsapp.ts) — `checkWhatsapp {phoneNumber}` →
  `{existsWhatsapp, chatId?, phoneNumber?}`. Основным chatId становится `номер@c.us`, потому что по нему надёжно
  работает отправка. Если в ответе есть скрытый идентификатор `…@lid`, он сохраняется в `aliases` чата:
  входящие могут прийти с любого из двух, и оба попадут в одну переписку. Номер собеседника во входящих
  WhatsApp берётся из chatId, потому что `senderPhoneNumber` WhatsApp не присылает.

> В MAX и Telegram `chatId` не совпадает с номером телефона, его назначает сервер. Если отправлять сообщения по номеру,
> ответы придут с другим `chatId`. Поэтому чат создаётся только после `checkAccount`.

Длину сообщения приложение ограничивает единым лимитом в 4000 символов, это самый строгий лимит (MAX).
Константа `MESSAGE_MAX_LENGTH` лежит в [shared/config](../src/shared/config/index.ts).

## Приём уведомлений

Используется HTTP API (`receiveNotification` + `deleteNotification`), вебхуки не нужны. Условия:

- в настройках инстанса **пустой `webhookUrl`**. Иначе `receiveNotification` отвечает
  `400 custom webhook url is set`;
- включены `incomingWebhook` (входящие), `outgoingWebhook` (статусы доставки) и `outgoingMessageWebhook`
  (сообщения, отправленные с телефона). В новом инстансе они выключены, поэтому форма входа предлагает
  включить их через `setSettings`.

| `typeWebhook` | Что делает приложение |
|---|---|
| `incomingMessageReceived` | добавляет входящее сообщение, при необходимости создаёт чат |
| `outgoingMessageReceived` | добавляет исходящее, отправленное с телефона |
| `outgoingAPIMessageReceived` | добавляет исходящее, если его ещё нет (обычно уже есть из ответа `sendMessage`) |
| `outgoingMessageStatus` | обновляет статус: `delivered`, `read`, `failed`, `noAccount`, `notInGroup` |
| остальные | игнорирует (но удаляет из очереди) |

`timestamp` в уведомлениях приходит в секундах, в приложении хранится в миллисекундах.

### Почему long polling, а не WebSocket

У GREEN-API есть ровно две технологии получения уведомлений —
[HTTP API](https://green-api.com/v3/docs/api/receiving/technology-http-api/) и
[Webhook Endpoint](https://green-api.com/v3/docs/api/receiving/technology-webhook-endpoint/).
WebSocket или SSE в API нет, поэтому «постоянного соединения» в прямом смысле сервис не предлагает.

- **Webhook Endpoint** требует публичный URL и сервер, который принимает `POST`. Приложение статическое
  (GitHub Pages), поэтому этот вариант недоступен.
- **HTTP API** — единственный путь для браузера. `receiveNotification?receiveTimeout=20` держит соединение
  открытым: запрос возвращается сразу, как только появляется уведомление, а при пустой очереди — по
  таймауту через 20 с, после чего цикл немедленно открывает следующий. Это не опрос раз в N секунд:
  задержка равна сетевому RTT, и перезагрузка страницы не нужна.
- Очередь уведомлений у инстанса **одна**: две вкладки браузера делили бы уведомления между собой и
  затирали бы состояние друг друга в `localStorage`. Приложение рассчитано на одну вкладку — ограничение
  осознанное.
