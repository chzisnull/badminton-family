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
      <div class="flex gap-2 items-start shrink-0">
        <button @click="showRegen = true" class="text-[10px] bg-white text-blue-600 border border-blue-100 px-3 py-2 rounded-xl font-black whitespace-nowrap shadow-sm active:bg-blue-50 transition-all">⚙️ 重设</button>
        <button @click="deleteAct" class="text-[10px] bg-red-50 text-red-400 border border-red-100 px-3 py-2 rounded-xl font-black whitespace-nowrap active:bg-red-100 transition-all">🗑 删除</button>
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
            <input v-model.number="m.score_a" @change="saveScore(m)" type="number" class="w-12 h-12 bg-white rounded-xl text-center font-black text-xl text-blue-600 border-none outline-none">
            <span class="text-slate-200 font-black">:</span>
            <input v-model.number="m.score_b" @change="saveScore(m)" type="number" class="w-12 h-12 bg-white rounded-xl text-center font-black text-xl text-red-600 border-none outline-none">
          </div>
          <div class="flex-1 text-left font-black text-lg text-slate-700 leading-tight">{{ m.team_b.join('&') }}</div>
        </div>
      </div>
    </div>

    <!-- Leaderboard -->
    <div v-if="tab === 'leaderboard'" class="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate__animated animate__fadeIn">
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

    <!-- Regen Modal -->
    <div v-if="showRegen" class="fixed inset-0 bg-slate-900/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-sm">
      <div class="bg-white w-full max-w-2xl rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-8 shadow-2xl animate__animated animate__fadeInUp animate__faster">
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-black text-slate-800">重设赛制参数</h3>
          <button @click="showRegen = false" class="text-slate-300 font-black text-2xl">&times;</button>
        </div>
        
        <div class="space-y-6">
          <div class="grid gap-3">
            <div v-for="m in modes" :key="m.id" @click="regenForm.type = m.id" :class="regenForm.type === m.id ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-100'" class="p-5 border-2 rounded-[2rem] cursor-pointer transition-all">
              <div class="font-black text-slate-800">{{ m.title }}</div>
            </div>
          </div>
          <div class="flex items-center justify-between bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
            <span class="font-black text-slate-500 uppercase tracking-widest text-xs">调整轮次 Rounds</span>
            <div class="flex items-center gap-4">
              <button @click="regenForm.rounds = Math.max(1, regenForm.rounds - 1)" class="w-10 h-10 bg-white rounded-xl shadow-sm font-black text-xl">-</button>
              <span class="font-black text-lg w-12 text-center">{{ regenForm.rounds }}</span>
              <button @click="regenForm.rounds++" class="w-10 h-10 bg-white rounded-xl shadow-sm font-black text-xl">+</button>
            </div>
          </div>
        </div>
        
        <div class="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
          <span class="text-xl">⚠️</span>
          <p class="text-[11px] font-black text-amber-600">重设将清空本活动当前的所有比分记录，无法恢复。</p>
        </div>

        <button @click="submitRegen" class="w-full py-5 bg-red-500 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-red-100 active:scale-95 transition-all">清空并重新生成</button>
      </div>
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
const regenForm = ref({ type: '', rounds: 1 });

const modes = [
  { id: 'doubles_rotation', title: '多人轮转赛' },
  { id: 'doubles_fixed_round_robin', title: '固搭循环赛' },
  { id: 'singles_round_robin', title: '单打循环赛' }
];

const finishedCount = computed(() => activity.value?.matches.filter(m => m.status === 'finished').length || 0);
const progress = computed(() => {
  if (!activity.value || activity.value.matches.length === 0) return 0;
  return Math.round((finishedCount.value / activity.value.matches.length) * 100);
});

const load = async () => {
  const res = await fetch(`/api/activities/${route.params.id}`);
  const data = await res.json();
  activity.value = data;
  regenForm.value.type = data.type;
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

const submitRegen = async () => {
  await fetch(`/api/activities/${route.params.id}/regenerate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regenForm.value)
  });
  showRegen.value = false;
  load();
};

const fetchLeaderboard = async () => {
  const res = await fetch(`/api/activities/${route.params.id}/leaderboard`);
  leaderboard.value = await res.json();
};

const formatType = (type) => {
  const map = { 'doubles_rotation': '多人轮转赛', 'doubles_fixed_round_robin': '固搭循环赛', 'singles_round_robin': '单打循环赛' };
  return map[type] || type;
};

onMounted(load);
</script>
