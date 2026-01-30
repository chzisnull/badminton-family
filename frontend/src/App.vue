<template>
  <div class="max-w-2xl mx-auto min-h-screen relative shadow-xl bg-white sm:bg-slate-50">
    <header class="bg-blue-600 p-4 text-white shadow-lg sticky top-0 z-50 flex justify-between items-center px-6">
      <router-link to="/" class="text-xl font-black flex items-center gap-2 tracking-tight">
        🏸 羽球一家人
      </router-link>
      <div class="flex gap-2">
        <router-link v-if="$route.path !== '/'" to="/" class="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur-md transition-all">首页</router-link>
      </div>
    </header>

    <main class="p-4 sm:p-6">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
</script>

<style>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
