import { createApp } from 'vue'
import { createPinia } from 'pinia'
import WordBookPage from '../pages/WordBookPage.vue'
import '../shared/styles/main.css'

const app = createApp(WordBookPage)

app.use(createPinia())

app.mount('#app')
