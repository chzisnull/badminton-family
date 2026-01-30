<template>
  <div v-if="activity" class="animate__animated animate__fadeIn">
    <div class="mb-8 flex justify-between items-start px-2">
      <div>
        <h2 class="text-3xl font-black text-slate-800 leading-tight">{{ activity.name }}</h2>
        <div class="flex gap-2 mt-2">
          <span class="text-[10px] font-black px-2 py-1 bg-blue-600 text-white rounded-lg uppercase tracking-wider">{{ formatType(activity.type) }}</span>
          <span class="text-[10px] font-black px-2 py-1 bg-slate-200 text-slate-500 rounded-lg uppercase tracking-wider">{{ activity.matches.length }} TOTAL</span>
        </div>
      </div>
      <div class="flex flex-col gap-2 items-end">
        <button @click="showRegen = true" class="text-[10px] bg-white text-blue-600 border border-blue-100 px-3 py-2 rounded-xl font-black">⚙️ 重设</button>
        <button @click="deleteAct" class="text-[10px] bg-red-50 text-red-400 px-3 py-2 rounded-xl font-black">🗑 删除</button>
      </div>
    </div>

    <!-- Progress -->
    <div class="bg-white p-6 rounded-[2.5rem] mb-8 border border-slate-100 shadow-sm">
      <div class="flex justify-between items-end mb-3 font-black px-1">
        <span class="text-slate-400 text-[10px] uppercase tracking-widest">比赛进度 Progress</span>
        <span class="text-blue-600 text-xl italic">{{ finishedCount }}/{{ activity.matches.length }}</span>
      </div>
      <div class="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1">
        <div :style="{ width: progress + '%' }" class="h-full bg-blue-600 rounded-full transition-all duration-500"></div>
      </div>
    </div>

    <div class="flex gap-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl">
      <button @click="tab = 'matches'" :class="tab === 'matches' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'" class="flex-1 py-2.5 rounded-xl text-sm font-black transition-all">对阵排期</button>
      <button @click="tab = 'leaderboard'; fetchLeaderboard()" :class="tab === 'leaderboard' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'" class="flex-1 py-2.5 rounded-xl text-sm font-black transition-all">实力排位</button>
    </div>

    <!-- Matches -->
    <div v-if="tab === 'matches'" class="space-y-6">
      <div v-for="m in activity.matches" :key="m.id" class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden group p-6">
        <div class="flex justify-between items-center mb-4">
          <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Round {{ m.round }}</span>
          <span :class="m.status === 'finished' ? 'text-green-500' : 'text-orange-400'" class="text-[10px] font-black uppercase tracking-widest">{{ m.status === 'finished' ? '已完赛' : '进行中' }}</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex-1 text-right font-black text-lg text-slate-700 leading-tight">{{ m.team_a.join('&') }}</div>
          <div class="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl">
            <input v-model.number="m.score_a" @change="saveScore(m)" type="number" class="w-12 h-12 bg-white rounded-xl text-center font-black text-blue-600 border-none">
            <span class="text-slate-200 font-black">:</span>
            <input v-model.number="m.score_b" @change="saveScore(m)" type="number" class="w-12 h-12 bg-white rounded-xl text-center font-black text-red-600 border-none">
          </div>
          <div class="flex-1 text-left font-black text-lg text-slate-700 leading-tight">{{ m.team_b.join('&') }}</div>
        </div>
      </div>
    </div>

    <!-- Leaderboard -->
    <div v-if="tab === 'leaderboard'" class="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
      <table class="w-full text-left">
        <thead class="bg-slate-50 text-[10px] font-black text-slate-400 border-b">
          <tr><th class="p-5">排名 RANK</th><th class="p-5">选手</th><th class="p-5 text-center">胜/负</th><th class="p-5 text-center">净胜</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-50">
          <tr v-for="(p, i) in leaderboard" :key="p.name">
            <td class="p-5 font-black text-slate-300 italic text-xl">#{{ i + 1 }}</td>
            <td class="p-5 font-black text-slate-800">{{ p.name }}</td>
            <td class="p-5 text-center text-sm font-bold text-slate-500">{{ p.win }} / {{ p.loss }}</td>
            <td class="p-5 text-center text-lg font-black" :class="p.diff >= 0 ? 'text-green-500' : 'text-red-400'">{{ p.diff > 0 ? '+' : '' }}{{ p.diff }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const activity = ref(null);
const tab = ref('matches');
const leaderboard = ref([]);
const showRegen = ref(false);

const finishedCount = computed(() => activity.value?.matches.filter(m => m.status === 'finished').length || 0);
const progress = computed(() => {
  if (!activity.value) return 0;
  return Math.round((finishedCount.value / activity.value.matches.length) * 100);
});

const load = async () => {
  const res = await fetch(`/api/activities/${route.params.id}`);
  activity.value = await res.json();
};

const saveScore = async (m) => {
  await fetch(`/api/matches/${m.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score_a: m.score_a, score_b: m.score_b })
  });
  m.status = 'finished';
};

const deleteAct = async () => {
  if (!confirm('确定删除吗？')) return;
  await fetch(`/api/activities/${route.params.id}`, { method: 'DELETE' });
  router.push('/');
};

const fetchLeaderboard = async () => {
  const res = await fetch(`/api/activities/${route.params.id}/leaderboard`);
  leaderboard.value = await res.json();
};

const formatType = (type) => {
  const map = { 'doubles_rotation': '多人轮转', 'doubles_fixed_round_robin': '固搭循环', 'singles_round_robin': '单打循环' };
  return map[type] || type;
};

onMounted(load);
</script>
