<template>
  <div class="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
    <!-- Header -->
    <header class="bg-blue-600 p-4 text-white shadow-lg sticky top-0 z-10">
      <div class="max-w-2xl mx-auto flex justify-between items-center">
        <h1 class="text-xl font-bold flex items-center gap-2">
          <Trophy class="w-6 h-6" /> 羽球对战助手
        </h1>
        <button v-if="step > 1" @click="step = 1" class="text-sm bg-blue-500 px-3 py-1 rounded-full">重新开始</button>
      </div>
    </header>

    <main class="max-w-2xl mx-auto p-4">
      <!-- Step 1: Mode Selection -->
      <section v-if="step === 1" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="text-center py-8">
          <h2 class="text-2xl font-bold text-slate-800">选择比赛赛制</h2>
          <p class="text-slate-500 mt-2">快速生成公平、专业的对阵表</p>
        </div>

        <div class="grid gap-4">
          <div v-for="mode in modes" :key="mode.id" 
            @click="selectMode(mode)"
            class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
            <div class="flex items-center gap-4">
              <div :class="`p-3 rounded-xl bg-${mode.color}-100 text-${mode.color}-600`">
                <component :is="mode.icon" class="w-8 h-8" />
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-lg group-hover:text-blue-600">{{ mode.title }}</h3>
                <p class="text-slate-500 text-sm">{{ mode.desc }}</p>
              </div>
              <ChevronRight class="text-slate-300" />
            </div>
          </div>
        </div>
      </section>

      <!-- Step 2: Player Input -->
      <section v-if="step === 2" class="space-y-6">
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
            <Users class="text-blue-600" /> 参赛人员名单
          </h2>
          <p class="text-sm text-slate-400 mb-4">每行输入一个名字，或者用空格分隔</p>
          <textarea 
            v-model="rawInput"
            placeholder="例如：\n小白\n晨曦\n老王"
            class="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          ></textarea>
          
          <div class="mt-6 flex gap-3">
            <button @click="step = 1" class="flex-1 py-3 px-4 border border-slate-200 rounded-xl font-medium text-slate-600">上一步</button>
            <button @click="generateMatches" class="flex-[2] py-3 px-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200">生成对阵表</button>
          </div>
        </div>
      </section>

      <!-- Step 3: Match Table -->
      <section v-if="step === 3" class="space-y-4 pb-10">
        <div class="flex justify-between items-center mb-2">
          <h2 class="font-bold text-lg">{{ selectedMode.title }} - 对阵图</h2>
          <span class="text-sm text-blue-600 font-medium">共 {{ matches.length }} 场</span>
        </div>

        <div v-for="(match, index) in matches" :key="index"
          class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between text-xs text-slate-400 font-medium">
            <span>第 {{ index + 1 }} 场</span>
            <span v-if="match.round">第 {{ match.round }} 轮</span>
          </div>
          
          <div class="p-4 flex items-center justify-between gap-2">
            <!-- Team A -->
            <div class="flex-1 text-center space-y-1">
              <div v-for="p in formatTeam(match.a || match.teamA)" :key="p" class="font-bold text-slate-700">{{ p }}</div>
            </div>

            <div class="flex flex-col items-center gap-1">
              <span class="text-xs font-black text-slate-300 italic">VS</span>
              <div class="flex items-center gap-1">
                <input type="number" class="w-10 h-10 bg-slate-100 rounded-lg text-center font-bold text-blue-600 outline-none" />
                <span class="text-slate-300">:</span>
                <input type="number" class="w-10 h-10 bg-slate-100 rounded-lg text-center font-bold text-red-600 outline-none" />
              </div>
            </div>

            <!-- Team B -->
            <div class="flex-1 text-center space-y-1">
              <div v-for="p in formatTeam(match.b || match.teamB)" :key="p" class="font-bold text-slate-700">{{ p }}</div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Bottom Nav (Mock) -->
    <nav v-if="step === 3" class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center shadow-2xl">
      <button class="flex flex-col items-center gap-1 text-blue-600">
        <LayoutGrid class="w-6 h-6" />
        <span class="text-[10px] font-bold">对阵</span>
      </button>
      <button class="flex flex-col items-center gap-1 text-slate-400">
        <Trophy class="w-6 h-6" />
        <span class="text-[10px] font-medium">排名</span>
      </button>
      <button class="flex flex-col items-center gap-1 text-slate-400">
        <Share2 class="w-6 h-6" />
        <span class="text-[10px] font-medium">分享</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  Trophy, ChevronRight, Users, User, UserPlus, 
  RotateCw, LayoutGrid, Share2 
} from 'lucide-vue-next'

const step = ref(1)
const rawInput = ref('')
const selectedMode = ref(null)
const matches = ref([])

const modes = [
  { id: 'rotation', title: '多人轮转赛', desc: '不固定搭档，每局自动换队友，计算个人分', icon: RotateCw, color: 'blue' },
  { id: 'doubles', title: '固搭循环赛', desc: '固定两人一组，组与组之间循环对战', icon: UserPlus, color: 'orange' },
  { id: 'singles', title: '单打循环赛', desc: '1对1经典循环，适合水平竞技', icon: User, color: 'green' }
]

function selectMode(mode) {
  selectedMode.value = mode
  step.value = 2
}

async function generateMatches() {
  const players = rawInput.value.split(/[\n\s]+/).filter(n => n.trim())
  if (players.length < 2) {
    alert('请至少输入2位参赛者')
    return
  }

  // Calling our Backend API
  try {
    const res = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: mapType(selectedMode.value.id),
        players: players
      })
    })
    const data = await res.json()
    matches.value = data.matches
    step.value = 3
  } catch (e) {
    console.error(e)
    alert('生成失败，请检查后端服务')
  }
}

function mapType(id) {
  if (id === 'rotation') return 'doubles_rotation'
  if (id === 'doubles') return 'doubles_fixed_round_robin'
  return 'singles_round_robin'
}

function formatTeam(team) {
  if (Array.isArray(team)) return team
  return [team]
}
</script>

<style>
.animate-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
