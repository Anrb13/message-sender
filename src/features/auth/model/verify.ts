import { createGreenApiClient, describeError } from '@/shared/api'
import type { Credentials, InstanceSettings, InstanceState } from '@/shared/api'
import { getSettingsFix } from './settings'

const STATE_ERRORS: Partial<Record<InstanceState, string>> = {
  notAuthorized: 'Инстанс не авторизован: войдите в аккаунт мессенджера в личном кабинете GREEN-API',
  starting: 'Инстанс запускается, попробуйте через пару минут',
  blocked: 'Аккаунт заблокирован мессенджером',
  sleepMode: 'Инстанс в спящем режиме: проверьте, что телефон с аккаунтом в сети',
  suspended: 'Инстанс приостановлен: проверьте оплату в личном кабинете GREEN-API',
  yellowCard: 'На аккаунт наложены временные ограничения мессенджера',
  pendingPassword: 'Требуется пароль двухэтапной проверки: завершите вход в личном кабинете GREEN-API',
}

export interface VerifyResult {
  wid?: string
  /** Какие настройки уведомлений нужно включить; null — всё готово */
  settingsFix: InstanceSettings | null
}

/** Проверяет учётные данные и состояние инстанса. Бросает Error с понятным пользователю текстом */
export async function verifyCredentials(credentials: Credentials): Promise<VerifyResult> {
  try {
    const client = createGreenApiClient(credentials)
    const { stateInstance } = await client.getStateInstance()
    if (stateInstance !== 'authorized') {
      throw new Error(STATE_ERRORS[stateInstance] ?? `Инстанс недоступен (состояние ${stateInstance})`)
    }

    const settings = await client.getSettings()
    return { wid: settings.wid, settingsFix: getSettingsFix(settings) }
  } catch (error) {
    throw new Error(describeError(error), { cause: error })
  }
}
