<template>
  <div class="animate__animated animate__fadeIn">
    <div class="flex gap-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl">
      <button @click="tab = 'activities'" :class="tab === 'activities' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'" class="flex-1 py-2.5 rounded-xl text-sm font-black transition-all">比赛中心</button>
      <button @click="tab = 'players'; fetchAllPlayers()" :class="tab === 'players' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'" class="flex-1 py-2.5 rounded-xl text-sm font-black transition-all">成员档案</button>
    </div>

    <!-- Activities List -->
    <div v-if="tab === 'activities'" class="space-y-6">
      <div class="flex justify-between items-end px-1">
        <div>
          <h2 class="text-xl font-black text-slate-800">对战大厅</h2>
          <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Live Match Arena</p>
        </div>
        <router-link to="/create" class="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-lg shadow-blue-200 active:scale-95 transition-all">新比赛</router-link>
      </div>
      
      <div v-if="history.length === 0" class="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
        <div class="text-4xl mb-4 opacity-20">🏐</div>
        <p class="text-slate-400 font-bold">还没有比赛记录哦</p>
      </div>

      <div class="grid gap-4">
        <router-link v-for="item in history" :key="item.id" :to="'/activity/' + item.id" class="group bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer active:scale-[0.98] hover:shadow-md transition-all">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <h3 class="font-black text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{{ item.name }}</h3>
            </div>
            <p class="text-[11px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-2">
              <span>📅 {{ formatDate(item.created_at) }}</span>
              <span class="text-slate-200">|</span>
              <span class="text-blue-500/70">{{ formatType(item.type) }}</span>
            </p>
          </div>
          <div class="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 font-black group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">→</div>
        </router-link>
      </div>
    </div>

    <!-- Players List -->
    <div v-if="tab === 'players'" class="space-y-6">
      <div class="flex justify-between items-end px-1">
        <div>
          <h2 class="text-xl font-black text-slate-800">家族成员</h2>
          <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{{ allPlayers.length }} Players</p>
        </div>
        <button @click="showAddModal = true" class="border-2 border-blue-600 text-blue-600 px-5 py-2 rounded-2xl text-sm font-black active:scale-95 transition-all">邀请成员</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <router-link v-for="p in allPlayers" :key="p.id" :to="'/player/' + p.name" class="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 text-center cursor-pointer active:scale-95 hover:shadow-md transition-all">
          <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl font-black shadow-inner">
            {{ p.name[0] }}
          </div>
          <div class="font-black text-slate-800 truncate px-2">{{ p.name }}</div>
        </router-link>
      </div>
    </div>

    <!-- Add Player Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
      <div class="bg-white w-full rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative">
        <h3 class="text-xl font-black text-center">加入家族成员</h3>
        <input v-model="newName" type="text" placeholder="输入姓名" class="w-full p-5 bg-slate-100 rounded-3xl outline-none font-bold text-center text-lg">
        <div class="flex gap-3">
          <button @click="showAddModal = false" class="flex-1 py-4 text-slate-400 font-black">取消</button>
          <button @click="addPlayer" class="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl">确认添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const tab = ref('activities');
const history = ref([]);
const allPlayers = ref([]);
const showAddModal = ref(false);
const newName = ref('');

const fetchHistory = async () => {
  const res = await fetch('/api/history');
  history.value = await res.json();
};

const fetchAllPlayers = async () => {
  const res = await fetch('/api/players');
  allPlayers.value = await res.json();
};

const addPlayer = async () => {
  if (!newName.value.trim()) return;
  await fetch('/api/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName.value.trim() })
  });
  newName.value = '';
  showAddModal.value = false;
  fetchAllPlayers();
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatType = (type) => {
  const map = {
    'doubles_rotation': '多人轮转赛',
    'doubles_fixed_round_robin': '固搭循环赛',
    'singles_round_robin': '单打循环赛'
  };
  return map[type] || type;
};

onMounted(fetchHistory);
</script>
