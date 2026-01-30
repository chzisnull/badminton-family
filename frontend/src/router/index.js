import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CreateView from '../views/CreateView.vue';
import MatchDetailView from '../views/MatchDetailView.vue';
import PlayerDetailView from '../views/PlayerDetailView.vue';

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/create', name: 'create', component: CreateView },
  { path: '/activity/:id', name: 'detail', component: MatchDetailView },
  { path: '/player/:name', name: 'player', component: PlayerDetailView }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
