// import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView/HomeView.vue'
import Error404View from '../views/Error404View/Error404View.vue'



export const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    // TODO determine if we should redirect here
    path: '/:catchAll(.*)',
    name: 'Error',
    component: Error404View
  }
]

// router creation handled by vite-ssg
