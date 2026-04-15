<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import {
  authErrorMessages,
  clearAuthSession,
  createSession,
  createUser,
  fetchCurrentUser,
  getAuthSession,
  type AuthUser,
} from '../modules/auth/api'

type AuthMode = 'login' | 'register'

const mode = ref<AuthMode>('login')
const submitting = ref(false)
const checkingSession = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const sessionUser = ref<AuthUser | null>(null)
const fieldErrors = reactive({
  email: '',
  password: '',
  displayName: '',
})

const form = reactive({
  email: '',
  password: '',
  displayName: '',
})

const pageTitle = computed(() =>
  mode.value === 'login' ? 'Login to your account' : 'Create your account',
)

const submitLabel = computed(() => (mode.value === 'login' ? 'Login' : 'Create account'))
const loginValidationMessage = '账号或密码错误'

onMounted(() => {
  void restoreSession()
})

async function restoreSession() {
  checkingSession.value = true
  errorMessage.value = ''

  try {
    const session = await getAuthSession()

    if (!session) {
      return
    }

    sessionUser.value = session.user
    await fetchCurrentUser()
    const refreshedSession = await getAuthSession()
    sessionUser.value = refreshedSession?.user ?? session.user
  } catch (error) {
    await clearAuthSession()
    sessionUser.value = null
    errorMessage.value = getErrorMessage(error)
  } finally {
    checkingSession.value = false
  }
}

async function submitAuthForm() {
  if (!validateForm()) {
    return
  }

  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const session =
      mode.value === 'login'
        ? await createSession({ email: form.email, password: form.password })
        : await createUser({
            email: form.email,
            password: form.password,
            display_name: form.displayName || undefined,
          })

    sessionUser.value = session.user
    successMessage.value = mode.value === 'login' ? 'Login successful.' : 'Registration successful.'
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    submitting.value = false
  }
}

async function logout() {
  await clearAuthSession()
  sessionUser.value = null
  successMessage.value = 'Logged out successfully.'
}

function switchMode(nextMode: AuthMode) {
  mode.value = nextMode
  resetMessages()
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function validateForm() {
  resetMessages()

  const normalizedEmail = form.email.trim()
  const displayName = form.displayName.trim()

  if (mode.value === 'login') {
    const isEmailValid = /.+@.+\..+/.test(normalizedEmail)
    const isPasswordValid = form.password.length >= 8 && form.password.length <= 128

    form.email = normalizedEmail
    form.displayName = displayName

    if (!normalizedEmail || !form.password || !isEmailValid || !isPasswordValid) {
      errorMessage.value = loginValidationMessage
      return false
    }

    return true
  }

  if (!normalizedEmail) {
    fieldErrors.email = authErrorMessages.fields.email.valueMissing
  } else if (!/.+@.+\..+/.test(normalizedEmail)) {
    fieldErrors.email = authErrorMessages.fields.email.invalid
  }

  if (!form.password) {
    fieldErrors.password = authErrorMessages.fields.password.valueMissing
  } else if (form.password.length < 8) {
    fieldErrors.password = authErrorMessages.fields.password.tooShort
  } else if (form.password.length > 128) {
    fieldErrors.password = authErrorMessages.fields.password.tooLong
  }

  if (mode.value === 'register' && displayName.length > 100) {
    fieldErrors.displayName = authErrorMessages.fields.display_name.tooLong
  }

  form.email = normalizedEmail
  form.displayName = displayName

  return !fieldErrors.email && !fieldErrors.password && !fieldErrors.displayName
}

function resetMessages() {
  errorMessage.value = ''
  successMessage.value = ''
  fieldErrors.email = ''
  fieldErrors.password = ''
  fieldErrors.displayName = ''
}
</script>

<template>
  <main class="auth-shell">
    <div class="auth-window">
      <section class="auth-hero auth-hero--compact">
        <div>
          <p class="eyebrow">Authentication</p>
          <h1>{{ sessionUser ? 'You are signed in' : pageTitle }}</h1>
          <p class="subtitle">
            {{
              sessionUser
                ? 'Your account is ready. Open the personal page to manage your vocabulary and learning records.'
                : 'Sign in to sync your learning data and access your personal word book.'
            }}
          </p>
        </div>
      </section>

      <section class="auth-panel auth-panel--compact">
        <div v-if="!sessionUser" class="auth-segment">
          <button
            class="auth-segment__item"
            :class="{ 'auth-segment__item--active': mode === 'login' }"
            type="button"
            @click="switchMode('login')"
          >
            Login
          </button>
          <button
            class="auth-segment__item"
            :class="{ 'auth-segment__item--active': mode === 'register' }"
            type="button"
            @click="switchMode('register')"
          >
            Register
          </button>
        </div>

        <p v-if="!sessionUser" class="auth-note">Use your email and password to continue.</p>

        <div v-if="checkingSession" class="empty-state">Checking existing session...</div>

        <template v-else>
          <div v-if="sessionUser" class="session-card">
            <p class="section-kicker">Current User</p>
            <h2>{{ sessionUser.display_name || sessionUser.email }}</h2>
            <p class="session-meta">{{ sessionUser.email }}</p>

            <div class="session-actions">
              <a class="hero-link" href="/personal.html" target="_blank" rel="noreferrer">
                Open personal page
              </a>
              <button class="secondary-button" type="button" @click="logout">Logout</button>
            </div>
          </div>

          <form v-else class="auth-form" novalidate @submit.prevent="submitAuthForm">
            <label class="auth-field">
              <span>Email</span>
              <input
                v-model="form.email"
                type="email"
                autocomplete="email"
                placeholder="user@example.com"
                maxlength="255"
              />
              <small v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</small>
            </label>

            <label v-if="mode === 'register'" class="auth-field">
              <span>Display name</span>
              <input
                v-model="form.displayName"
                type="text"
                autocomplete="nickname"
                placeholder="Pian Xi"
                maxlength="100"
              />
              <small v-if="fieldErrors.displayName" class="field-error">{{
                fieldErrors.displayName
              }}</small>
            </label>

            <label class="auth-field">
              <span>Password</span>
              <input
                v-model="form.password"
                type="password"
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                minlength="8"
                maxlength="128"
                placeholder="Enter your password"
              />
              <small v-if="fieldErrors.password" class="field-error">{{
                fieldErrors.password
              }}</small>
            </label>

            <button class="refresh-button auth-submit" type="submit" :disabled="submitting">
              {{ submitting ? 'Submitting...' : submitLabel }}
            </button>
          </form>
        </template>

        <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="feedback feedback--success">{{ successMessage }}</p>
      </section>
    </div>
  </main>
</template>
