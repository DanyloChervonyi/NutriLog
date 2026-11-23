# Проверка API через Postman и Thunder Client

## Адреса

- API: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/api/docs` (доступен в development)
- Health check: `GET http://localhost:4000/api/v1/health`

Запустите сервисы и API из корня репозитория: `docker compose up -d postgres redis`, затем `pnpm dev:api`. Для работы эндпоинтов профиля и дневника сначала примените миграции по инструкции в корневом README.

## Postman

Создайте коллекцию и переменные:

| Переменная | Значение |
| --- | --- |
| `baseUrl` | `http://localhost:4000/api/v1` |
| `accessToken` | оставить пустой до регистрации или входа |

Для защищённых запросов откройте **Authorization**, выберите **Bearer Token** и укажите `{{accessToken}}`.

## Thunder Client

Создайте Environment с теми же переменными (`baseUrl`, `accessToken`). Для защищённого запроса откройте **Auth**, выберите **Bearer** и укажите `{{accessToken}}`.

## Проверка регистрации и входа

Отправьте `POST {{baseUrl}}/auth/register` с заголовком `Content-Type: application/json` и JSON:

```json
{
  "username": "nutrilog_check",
  "email": "nutrilog-check@example.com",
  "password": "ChangeThisPassword123!"
}
```

В успешном ответе сохраните `accessToken` в переменную коллекции или окружения. Регистрация и вход также устанавливают HttpOnly refresh-cookie. Если адрес уже зарегистрирован, войдите через `POST {{baseUrl}}/auth/login` с телом:

```json
{
  "identifier": "nutrilog_check",
  "password": "ChangeThisPassword123!"
}
```

Скопируйте `accessToken` из ответа в `accessToken`. Далее проверьте `GET {{baseUrl}}/auth/me` с Bearer token.

При проверке в Postman или Thunder Client можно использовать тестовый адрес почты и случайный пароль. Не используйте пароль от реального аккаунта и не сохраняйте секреты в коллекции, которую будете экспортировать или отправлять другим.

## Основные сценарии

1. `GET {{baseUrl}}/profile` — получить профиль и персональные цели.
2. `PUT {{baseUrl}}/profile` — сохранить профиль. Допустимые значения перечислений видны в Swagger; пример тела:

   ```json
   {
     "gender": "FEMALE",
     "age": 30,
     "heightCm": 165,
     "weightKg": 65,
     "goal": "MAINTAIN",
     "activityLevel": "MEDIUM"
   }
   ```

3. `GET {{baseUrl}}/foods/search?q=apple&page=1&pageSize=10` — поиск продуктов.
4. `POST {{baseUrl}}/diary/meals` — создать приём пищи на дату:

   ```json
   { "date": "2026-11-20", "type": "BREAKFAST" }
   ```

5. `POST {{baseUrl}}/diary/meals/{{mealId}}/items` — добавить продукт в граммах:

   ```json
   { "foodId": "<UUID продукта из поиска>", "grams": 150 }
   ```

6. `GET {{baseUrl}}/diary?date=2026-11-20` — получить дневник и итоги.

Все запросы к профилю и дневнику требуют Bearer token. Идентификаторы `mealId` и `foodId` берите из фактических ответов API.

## Обновление токена

`POST {{baseUrl}}/auth/refresh` обновляет сессию по HttpOnly-cookie `nutrilog_refresh`. Клиент должен сохранить cookie из ответа на регистрацию или вход и отправлять её обратно; для запросов с cookie установите заголовок `Origin` в адрес интерфейса, например `http://localhost:3001`. В Postman включите cookie jar для `localhost`; в Thunder Client используйте встроенное управление cookies.

## Google OAuth

`GET {{baseUrl}}/auth/google` начинает вход через Google и требует `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` в `.env`. Для проверки OAuth настройте callback URI Google Cloud Console в точности как `GOOGLE_CALLBACK_URL` из `.env`. Эти учётные данные не нужны для проверки регистрации и входа по паролю.
