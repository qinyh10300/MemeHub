import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import DexPlugin from './plugins/dex'
import './styles/globals.css'

const app = createApp(App)
app.use(DexPlugin)
app.use(router)
app.mount('#app')
