import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router'

// export const createApp = ViteSSG(App, { routes })
export const createApp = ViteSSG(
    App,
    { routes },
    ({ app, router, routes, isClient, initialState }) => {
        // optional: install plugins, etc.
    },
)
