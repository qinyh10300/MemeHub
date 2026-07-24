import { createApp } from "vue";
import App from "./App.vue";
import DexPlugin from "./plugins/dex";
import router from "./router";

import "./global.css";

createApp(App).use(DexPlugin).use(router).mount("#app");
