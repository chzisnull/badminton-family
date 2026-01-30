<template>
  <div class="animate__animated animate__fadeInUp">
    <h2 class="text-2xl font-black mb-8 px-2 flex items-center gap-2">
      发起新篇章 <span class="text-blue-600 italic">NEW GAME</span>
    </h2>
    
    <div class="bg-white p-8 rounded-[3rem] shadow-sm space-y-8 border border-slate-100">
      <div>
        <label class="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">活动主题 Name</label>
        <input v-model="form.name" type="text" placeholder="例：南京奥体周六场" class="w-full p-5 bg-slate-50 rounded-3xl outline-none border-none font-black text-lg shadow-inner">
      </div>

      <div>
        <label class="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">赛制模式 Mode</label>
        <div class="grid gap-3">
          <div v-for="m in modes" :key="m.id" @click="form.type = m.id" :class="form.type === m.id ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50' : 'border-slate-100'" class="p-5 border-2 rounded-3xl cursor-pointer transition-all active:scale-[0.98]">
            <div class="font-black text-slate-800 text-lg leading-tight">{{ m.title }}</div>
            <div class="text-[11px] text-slate-400 font-medium mt-1">{{ m.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Doubles Fixed Pairing UI -->
      <div v-if="form.type === 'doubles_fixed_round_robin'" class="space-y-4 animate__animated animate__fadeIn">
        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">组建固定搭档 ({{ form.teams.length }} 组)</label>
        
        <div class="space-y-2">
          <div v-for="(team, idx) in form.teams" :key="idx" class="flex justify-between items-center bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <span class="font-black text-blue-700">{{ team[0] }} & {{ team[1] }}</span>
            <button @click="removeTeam(idx)" class="text-red-400 font-black">移除</button>
          </div>
        </div>

        <div v-if="pairingState.length > 0 || allPlayers.length > 0" class="bg-slate-50 p-5 rounded-3xl border border-slate-100">
          <p class="text-[10px] font-black text-slate-400 mb-3 uppercase text-center">
            {{ pairingState.length === 0 ? '请点击选择第一位搭档' : '请选择与 ' + pairingState[0] + ' 搭档的人' }}
          </p>
          <div class="flex flex-wrap gap-2 justify-center">
            <div v-for="p in availableForPairing" :key="p.id" @click="selectForPairing(p.name)" class="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black cursor-pointer shadow-sm active:scale-90">
              {{ p.name }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="form.type !== 'doubles_fixed_round_robin'" class="space-y-6">
        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest">选择选手 ({{ form.selectedPlayers.length }}人)</label>
        <div class="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 min-h-[50px]">
          <div v-for="name in form.selectedPlayers" :key="name" @click="togglePlayer(name)" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 animate__animated animate__bounceIn">
            {{ name }} ×
          </div>
        </div>
        
        <div class="flex flex-wrap gap-2 bg-slate-100/50 p-5 rounded-3xl">
          <div v-for="p in allPlayers" :key="p.id" @click="togglePlayer(p.name)" :class="form.selectedPlayers.includes(p.name) ? 'opacity-30 pointer-events-none' : ''" class="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-black cursor-pointer shadow-sm active:scale-90">
            {{ p.name }}
          </div>
          <div @click="goToPlayers" class="bg-blue-600 text-white px-4 py-2.5 rounded-2xl text-xs font-black cursor-pointer shadow-lg animate-pulse">+ 添加成员</div>
        </div>
      </div>

      <div>
        <label class="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">设定循环 Rounds</label>
        <div class="flex items-center gap-6 bg-slate-50 p-5 rounded-3xl border border-slate-100">
          <button @click="form.rounds = Math.max(1, form.rounds - 1)" class="w-12 h-12 bg-white rounded-2xl shadow-sm font-black text-2xl">-</button>
          <div class="flex-1 text-center font-black text-xl italic text-blue-600">{{ form.rounds }} 轮</div>
          <button @click="form.rounds++" class="w-12 h-12 bg-white rounded-2xl shadow-sm font-black text-2xl">+</button>
        </div>
      </div>

      <button @click="submit" class="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-200 active:scale-95 transition-all">生成并开始</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const allPlayers = ref([]);
const form = ref({ name: '', type: 'doubles_rotation', selectedPlayers: [], teams: [], rounds: 1 });
const pairingState = ref([]);

const modes = [
  { id: 'doubles_rotation', title: '多人轮转赛', desc: '散局神器。每局换队友平衡体力。' },
  { id: 'doubles_fixed_round_robin', title: '固搭循环赛', desc: '双人组队固定。所有小组大循环。' },
  { id: 'singles_round_robin', title: '单打循环赛', desc: '巅峰 1v1 标准对战。' }
];

const fetchPlayers = async () => {
  const res = await fetch('/api/players');
  allPlayers.value = await res.json();
};

const togglePlayer = (name) => {
  const idx = form.value.selectedPlayers.indexOf(name);
  if (idx > -1) form.value.selectedPlayers.splice(idx, 1);
  else form.value.selectedPlayers.push(name);
};

const availableForPairing = computed(() => {
  const selectedNames = form.value.teams.flat().concat(pairingState.value);
  return allPlayers.value.filter(p => !selectedNames.includes(p.name));
});

const selectForPairing = (name) => {
  pairingState.value.push(name);
  if (pairingState.value.length === 2) {
    form.value.teams.push([...pairingState.value]);
    pairingState.value = [];
  }
};

const removeTeam = (idx) => form.value.teams.splice(idx, 1);

const goToPlayers = () => router.push({ name: 'home', query: { tab: 'players' } });

const submit = async () => {
  let playersToSubmit = [];
  if (form.value.type === 'doubles_fixed_round_robin') {
    if (form.value.teams.length < 2) return alert('请至少创建2个小组');
    playersToSubmit = form.value.teams.flat(); // Backend will handle pairing by 2s
  } else {
    if (form.value.selectedPlayers.length < 2) return alert('请选择至少2人');
    playersToSubmit = form.value.selectedPlayers;
  }

  const res = await fetch('/api/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: form.value.name || '未命名活动',
      type: form.value.type,
      players: playersToSubmit,
      rounds: form.value.rounds
    })
  });
  const data = await res.json();
  router.push('/activity/' + data.id);
};

onMounted(fetchPlayers);
</script>
