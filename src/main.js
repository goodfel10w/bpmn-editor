import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// bpmn-js styles
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'

// App styles
import './assets/styles/variables.css'
import './assets/styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
