import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import Hello from '@/components/Hello'
import Servus from '@/components/Servus'

Vue.use(VueRouter)
Vue.use(VueResource)

export default new VueRouter({
  routes: [
    {
      path: '/',
      redirect: 'hello'
    },
    {
      path: '/hello',
      name: 'Hello',
      component: Hello
    },
    {
      path: '/servus',
      name: 'Servus',
      component: Servus
    }
  ]
})
