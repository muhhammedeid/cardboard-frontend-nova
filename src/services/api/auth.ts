import { FrontendError, normalizeApiError } from './errors'

/**
 * Operator sign-in from inside the app.
 *
 * The Desk login page stays available (OTP and email-link flows live there), but an
 * operator whose session expired should never have to leave Nova to get back in — and
 * when the credentials are wrong they must read the server's own sentence instead of a
 * silent bounce back to this screen.
 *
 * Same-origin by design: the SPA is always served from the Frappe origin, so the session
 * cookie the backend sets here is the same one every later call uses.
 */
const LOGIN_METHOD = '/api/method/login'
const INVALID_CREDENTIALS = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
const MISSING_INPUT = 'أدخل البريد الإلكتروني وكلمة المرور.'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResult {
  user: string
  fullName: string
  homePage: string
}

interface LoginPayload {
  message?: string | { full_name?: string }
  full_name?: string
  home_page?: string
  _server_messages?: string
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const email = credentials.email.trim()
  const password = credentials.password
  if (!email || !password) throw new FrontendError('validation', MISSING_INPUT)

  let response: Response
  try {
    response = await fetch(LOGIN_METHOD, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ usr: email, pwd: password }),
    })
  } catch {
    throw new FrontendError('network', 'تعذر الاتصال بالخادم. تحقق من الشبكة ثم أعد المحاولة.')
  }

  const payload = (await response.json().catch(() => null)) as LoginPayload | null

  // 401 is Frappe's answer for a wrong password or a disabled account; 403 covers a
  // banned/limited user. Neither should surface Frappe's English sentence.
  if (response.status === 401 || response.status === 403) {
    throw new FrontendError('authentication', INVALID_CREDENTIALS, response.status)
  }
  if (!response.ok) throw normalizeApiError(response.status, payload?._server_messages)

  // Frappe answers `{"message":"Logged In","home_page":…,"full_name":…}`: the message is
  // the status sentence, so the identity comes from the email that just authenticated.
  const nestedName = typeof payload?.message === 'object' ? (payload.message?.full_name ?? '') : ''
  const fullName = payload?.full_name || nestedName

  return {
    user: email,
    fullName,
    homePage: payload?.home_page || '/',
  }
}
