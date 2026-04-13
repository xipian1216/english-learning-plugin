import { createApp } from 'vue'
import { createPinia } from 'pinia'

import AuthPage from '../pages/AuthPage.vue'
import '../shared/styles/main.css'

const app = createApp(AuthPage)

app.use(createPinia())

app.mount('#app')
