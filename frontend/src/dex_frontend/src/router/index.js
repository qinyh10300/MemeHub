import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import TokenView from "../views/TokenView.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: "/", name: "home", component: HomeView },
        { path: "/token/:address", name: "token", component: TokenView, props: true },
    ],
});

export default router;
