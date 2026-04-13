import { createApp } from 'vue'
import { createPinia } from 'pinia'

import PersonalPage from '../pages/PersonalPage.vue'
import '../shared/styles/main.css'

const app = createApp(PersonalPage)

app.use(createPinia())

app.mount('#app')
