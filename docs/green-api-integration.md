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
| `sendMessage` | POST | отправка текста, ответ `{ idMessage }` |
| `receiveNotification` | GET | long polling входящих уведомлений, `?receiveTimeout=5..60` |
| `deleteNotification` | DELETE | удаление обработанного уведомления: `/{receiptId}` |

Клиент — [client.ts](../src/shared/api/green-api/client.ts):

- `createGreenApiClient(credentials)` возвращает объект с методами.
- Пустое тело ответа (так выглядит пустая очередь у `receiveNotification`) превращается в `null`.
- HTTP-ошибки бросаются как `GreenApiError` со `status`. `status = 0` значит, что запрос не дошёл до сервера.
- `AbortError` пробрасывается как есть, чтобы цикл polling можно было остановить.

## Различия мессенджеров: адаптеры

Методы и формат уведомлений у MAX, Telegram и WhatsApp общие. Различия собраны в адаптерах
([adapters/](../src/shared/api/green-api/adapters)), которые реализуют `MessengerAdapter`:

| | MAX | Telegram | WhatsApp |
|---|---|---|---|
| Номер → chatId | `checkAccount` | `checkAccount` | `checkWhatsapp` |
| Формат chatId | числовая строка | числовая строка | `…@c.us` / `…@lid` |
| `typeInstance` | `v3` | `telegram` | `whatsapp` |

> В MAX `chatId` не совпадает с номером телефона, его назначает сервер. Если отправлять сообщения по номеру,
> ответы придут с другим `chatId`. Поэтому чат создаётся только после `checkAccount`.

Длину сообщения приложение ограничивает единым лимитом в 4000 символов, это самый строгий лимит (MAX).
Константа `MESSAGE_MAX_LENGTH` лежит в [shared/config](../src/shared/config/index.ts).
