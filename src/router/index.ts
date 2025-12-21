// import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView/HomeView.vue'
import ExperimentalView from '../views/ExperimentalView/ExperimentalView.vue'
import Error404View from '../views/Error404View/Error404View.vue'



export const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/experimental',
    name: 'Experimental',
    component: ExperimentalView,
    meta: {
      fullScreen: true
    }
  },
  {
    // TODO determine if we should redirect here
    path: '/:catchAll(.*)',
    name: 'Error',
    component: Error404View
  }
]

// router creation handled by vite-ssg
