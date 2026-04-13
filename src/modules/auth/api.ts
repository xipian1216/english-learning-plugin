import { buildApiUrl } from '../../shared/config'

export const authErrorMessages = {
  common: {
    40001: '输入信息有误，请检查后重试',
    40100: '账号或登录状态无效',
    40300: '账号不可用',
    40900: '该邮箱已被注册',
  },
  fields: {
    email: {
      valueMissing: '请输入邮箱',
      invalid: '请输入合法的邮箱地址',
    },
    password: {
      valueMissing: '请输入密码',
      tooShort: '密码至少需要 8 个字符',
      tooLong: '密码长度不能超过 128 个字符',
    },
    display_name: {
      tooLong: '显示名称长度不能超过 100 个字符',
    },
    old_password: {
      valueMissing: '请输入当前密码',
      tooShort: '当前密码至少需要 8 个字符',
      tooLong: '当前密码长度不能超过 128 个字符',
    },
    new_password: {
      valueMissing: '请输入新密码',
      tooShort: '新密码至少需要 8 个字符',
      tooLong: '新密码长度不能超过 128 个字符',
    },
  },
} as const

export type AuthUser = {
  id: string
  email: string
  display_name?: string
  status?: string
  english_level?: string
  learning_goal?: string
  preferred_explanation_language?: string
}

export type AuthSession = {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T | null
}

export class AuthApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'AuthApiError'
    this.code = code
  }
}

type LoginPayload = {
  email: string
  password: string
}

type RegisterPayload = LoginPayload & {
  display_name?: string
}

type SessionResponse = {
  access_token: string
  token_type: string
  expires_in: number
  user: AuthUser
}

type StorageItems = Record<string, unknown>
type ExtensionStorage = {
  get(keys: string | string[] | Record<string, unknown> | null, callback: (items: StorageItems) => void): void
  set(items: StorageItems, callback?: () => void): void
  remove(keys: string | string[], callback?: () => void): void
}

const SESSION_STORAGE_KEY = 'authSession'

export async function createSession(payload: LoginPayload) {
  const response = await requestJson<SessionResponse>('/sessions', {
    method: 'POST',
    body: payload,
  })

  const session = toAuthSession(response)
  await saveAuthSession(session)
  return session
}

export async function createUser(payload: RegisterPayload) {
  const response = await requestJson<SessionResponse>('/users', {
    method: 'POST',
    body: payload,
  })

  const session = toAuthSession(response)
  await saveAuthSession(session)
  return session
}

export async function fetchCurrentUser() {
  const session = await getAuthSession()

  if (!session) {
    throw new Error('No active session')
  }

  const user = await requestJson<AuthUser>('/users/me', {
    method: 'GET',
    token: session.accessToken,
  })

  const nextSession: AuthSession = {
    ...session,
    user,
  }

  await saveAuthSession(nextSession)
  return user
}

export async function getAuthSession() {
  const stored = await storageGet<AuthSession>(SESSION_STORAGE_KEY)
  return stored ?? null
}

export async function saveAuthSession(session: AuthSession) {
  await storageSet(SESSION_STORAGE_KEY, session)
}

export async function clearAuthSession() {
  await storageRemove(SESSION_STORAGE_KEY)
}

async function requestJson<T>(path: string, options: { method: string; body?: unknown; token?: string }) {
  const response = await fetch(buildApiUrl(path), {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const result = (await response.json()) as ApiEnvelope<T>

  if (!response.ok || result.code !== 0 || !result.data) {
    throw new AuthApiError(result.code, mapAuthErrorMessage(result.code, result.message))
  }

  return result.data
}

function mapAuthErrorMessage(code: number, fallbackMessage: string) {
  const knownMessage = authErrorMessages.common[code as keyof typeof authErrorMessages.common]
  return knownMessage ?? (fallbackMessage || '请求失败，请稍后重试')
}

function toAuthSession(payload: SessionResponse): AuthSession {
  return {
    accessToken: payload.access_token,
    tokenType: payload.token_type,
    expiresIn: payload.expires_in,
    user: payload.user,
  }
}

function getExtensionStorage() {
  return (
    globalThis as typeof globalThis & {
      chrome?: {
        storage?: {
          local?: ExtensionStorage
        }
      }
    }
  ).chrome?.storage?.local
}

function storageGet<T>(key: string) {
  return new Promise<T | undefined>((resolve) => {
    const extensionStorage = getExtensionStorage()

    if (!extensionStorage) {
      resolve(undefined)
      return
    }

    extensionStorage.get([key], (items: StorageItems) => {
      resolve(items[key] as T | undefined)
    })
  })
}

function storageSet<T>(key: string, value: T) {
  return new Promise<void>((resolve) => {
    const extensionStorage = getExtensionStorage()

    if (!extensionStorage) {
      resolve()
      return
    }

    extensionStorage.set({ [key]: value }, () => {
      resolve()
    })
  })
}

function storageRemove(key: string) {
  return new Promise<void>((resolve) => {
    const extensionStorage = getExtensionStorage()

    if (!extensionStorage) {
      resolve()
      return
    }

    extensionStorage.remove(key, () => {
      resolve()
    })
  })
}
