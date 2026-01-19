import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import './assets/styles/main.css'
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css'

const app = createApp(App)

app.use(createPinia())

app.mount('#app')
