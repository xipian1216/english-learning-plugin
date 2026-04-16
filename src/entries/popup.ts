import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PopupPage from '../pages/PopupPage.vue'
import '../shared/styles/main.css'

const app = createApp(PopupPage)

app.use(createPinia())

app.mount('#app')
