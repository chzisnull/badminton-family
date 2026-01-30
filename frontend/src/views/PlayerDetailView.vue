<template>
  <div v-if="activities" class="animate__animated animate__fadeIn">
    <div class="mb-8 flex items-center gap-5 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div class="w-20 h-20 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center text-3xl font-black shadow-xl">{{ route.params.name[0] }}</div>
      <div>
        <h2 class="text-2xl font-black text-slate-800">{{ route.params.name }}</h2>
        <span class="text-xs font-black px-2 py-0.5 bg-blue-100 text-blue-600 rounded-md">累计参加 {{ activities.length }} 场</span>
      </div>
    </div>
    
    <h3 class="font-black text-slate-400 mb-4 px-2 text-[10px] uppercase tracking-widest">参赛活动 / History</h3>
    <div class="space-y-4">
      <router-link v-for="act in activities" :key="act.id" :to="'/activity/' + act.id" class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-95 transition-all">
        <div>
          <div class="text-[10px] font-black text-slate-300 uppercase mb-1">{{ formatDate(act.created_at) }}</div>
          <h4 class="font-black text-slate-800 text-lg">{{ act.name }}</h4>
          <p class="text-xs text-slate-400 mt-1 uppercase">{{ formatType(act.type) }}</p>
        </div>
        <div class="text-right">
          <div class="text-blue-600 font-black text-lg italic">胜 {{ act.wins }}</div>
          <div class="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-tighter">View Detail ></div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activities = ref([]);

const load = async () => {
  const res = await fetch(`/api/players/${route.params.name}/activities`);
  activities.value = await res.json();
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatType = (type) => {
  const map = { 'doubles_rotation': '轮转', 'doubles_fixed_round_robin': '固搭', 'singles_round_robin': '单打' };
  return map[type] || type;
};

onMounted(load);
</script>
