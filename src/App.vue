<template>
  <div class="h-[100dvh] w-full bg-[#0f172a] text-slate-300 font-sans selection:bg-blue-500/30 overflow-hidden relative flex flex-col">
    
    <div class="flex-1 w-full h-full relative z-0">
      <router-view @toast="handleToast" />
    </div>

    <SecurityAlert 
      v-if="alertState.show"
      :title="alertState.title"
      :message="alertState.message"
      :icon="alertState.icon"
      :deviceId="alertState.deviceId"
      @close="closeAlert"
      @mute-vehicle="handleRemoteMute"
    />

    <Transition name="toast-slide">
      <div v-if="toast.show" 
           class="fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all duration-300 min-w-[320px] max-w-sm cursor-pointer" 
           :class="toastStyle"
           @click="toast.show = false">
        
        <div class="text-2xl flex-shrink-0">{{ toast.icon }}</div>
        
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-white text-sm tracking-wide truncate">{{ toast.title }}</h3>
          <p class="text-xs text-white/90 font-medium mt-0.5 break-words leading-relaxed">{{ toast.message }}</p>
        </div>

        <button class="text-white/50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { socket } from '@/services/socket'; // 🔌 ใช้ท่อ Socket กลาง
import SecurityAlert from '@/components/SecurityAlert.vue'; // 🚨 Import ตัวแจ้งเตือนมา
import api from '@/api';

const router = useRouter();
const audio = new Audio("/alert.mp3");

// --- 🚨 Security Alert State (ตัวใหม่ที่เพิ่มมา) ---
const alertState = reactive({
  show: false,
  title: '',
  message: '',
  icon: '🚨',
  deviceId: ''
});

// --- 🔔 Toast State เดิมของคุณ ---
const toast = reactive({
  show: false,
  title: '',
  message: '',
  icon: '',
  type: 'success', 
  timer: null
});

// --- 🚀 เริ่มต้นดักฟัง Socket ทันทีที่เปิดเว็บ ---
onMounted(() => {
  console.log("🌐 [App.vue] Global Listener Is Ready!");

  socket.on("new_alert", (data) => {
    console.log("📢 [App.vue] RECEIVED ALERT:", data);
    
    const msg = (data.message || "").toUpperCase();
    
    // เงื่อนไขเด้งหน้าแดง (Critical) - เช็ค THEFT_DETECTED จาก Log ของคุณ
    if (msg.includes("THEFT") || msg.includes("DETECTED") || msg.includes("GEOFENCE") || msg.includes("ACCIDENT")) {
      alertState.deviceId = data.deviceId;
      alertState.title = msg.includes("THEFT") ? "🚨 ตรวจพบการโจรกรรม!" : "⚠️ แจ้งเตือนเหตุร้าย!";
      alertState.message = data.message;
      alertState.icon = "🚨";
      alertState.show = true;
      
      // เล่นเสียงไซเรน
      audio.play().catch(() => console.log("Audio blocked by browser, need user interaction first."));
      
      // ขึ้น Toast ควบคู่ไปด้วย
      setupToast({ title: 'Critical Alert!', message: data.message, type: 'error' });
    } else {
      // แจ้งเตือนทั่วไป (โชว์แค่ Toast)
      setupToast({ title: 'System Info', message: data.message, type: 'warning' });
    }
  });
});

// --- 🛠️ Functions สำหรับ SecurityAlert ---
const closeAlert = () => {
  alertState.show = false;
  audio.pause();
  audio.currentTime = 0;
};

const handleRemoteMute = async () => {
  try {
    await api.post(`/devices/${alertState.deviceId}/command`, { command: "stop_alarm", value: 1 });
    setupToast({ title: 'Success', message: 'ส่งคำสั่งปิดเสียงรถแล้ว', type: 'success' });
    closeAlert();
  } catch (e) {
    setupToast({ title: 'Error', message: 'ไม่สามารถปิดเสียงรถได้', type: 'error' });
  }
};

// --- 🛠️ Logic ของ Toast เดิมที่คุณเขียนไว้ ---
const setupToast = (data) => {
  toast.title = data.title || 'แจ้งเตือน';
  toast.message = data.message || '';
  toast.icon = data.icon || '🔔';

  const colorClass = data.color || '';
  if (colorClass.includes('error') || colorClass.includes('red') || data.type === 'error') {
    toast.type = 'error';
    if (!data.icon) toast.icon = '❌';
  } else if (colorClass.includes('warning') || data.type === 'warning') {
    toast.type = 'warning';
    if (!data.icon) toast.icon = '⚠️';
  } else {
    toast.type = 'success';
    if (!data.icon) toast.icon = '✅';
  }

  toast.show = true;
  if (toast.timer) clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { toast.show = false; }, 3000);
};

const handleToast = (payload) => {
  if (!payload) return;
  if (typeof payload === 'string') {
    setupToast({ title: payload });
    return;
  }
  setupToast(payload);
};

const toastStyle = computed(() => {
  switch (toast.type) {
    case 'success': return 'bg-emerald-600/90 border-emerald-500/50 shadow-emerald-900/50';
    case 'error': return 'bg-rose-600/90 border-rose-500/50 shadow-rose-900/50';
    case 'warning': return 'bg-amber-500/90 border-amber-400/50 shadow-amber-900/50';
    default: return 'bg-slate-700/90 border-slate-600 shadow-slate-900/50';
  }
});
</script>

<style>
/* Animation */
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateX(20px) scale(0.95); }
</style>