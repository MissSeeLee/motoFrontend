<template>
  <div class="h-[100dvh] w-full bg-[#0f172a] text-slate-300 font-sans selection:bg-blue-500/30 overflow-hidden relative flex flex-col">
    
    <div class="flex-1 w-full h-full relative z-0">
      <router-view @toast="handleToast" />
    </div>

    <SecurityAlert 
      v-show="alertState.show"
      :title="alertState.title"
      :message="alertState.message"
      :icon="alertState.icon"
      :deviceId="alertState.deviceId"
      @close="closeAlert"
      @mute-vehicle="handleRemoteMute"
      class="z-[9999]"
    />

    <div class="fixed top-5 right-5 z-[9999] pointer-events-none flex flex-col gap-2">
      <div 
        v-show="toast.show" 
        class="flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] max-w-sm cursor-pointer pointer-events-auto" 
        :class="toastStyle"
        @click="toast.show = false"
      >
        
        <div class="text-2xl flex-shrink-0">{{ toast.icon }}</div>
        
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-white text-sm tracking-wide truncate">{{ toast.title }}</h3>
          <p class="text-xs text-white/90 font-medium mt-0.5 break-words leading-relaxed">{{ toast.message }}</p>
        </div>

        <button class="text-white/50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { socket } from '@/services/socket'; 
import SecurityAlert from '@/components/SecurityAlert.vue'; 
import api from '@/api';

const router = useRouter();
const audio = new Audio("/alert.mp3");

const alertState = reactive({
  show: false,
  title: '',
  message: '',
  icon: '🚨',
  deviceId: ''
});

const toast = reactive({
  show: false,
  title: '',
  message: '',
  icon: '',
  type: 'success', 
  timer: null
});

onMounted(() => {
  console.log("🌐 [App.vue] Global Listener Is Ready!");

  socket.on("new_alert", (data) => {
    if (!data || !data.deviceId) return;
    
    console.log("📢 [App.vue] RECEIVED ALERT:", data);
    const rawMsg = data.message || "";
    const msg = rawMsg.toUpperCase();
    
    // 🛡️ ตัวแปรสำหรับจัดรูปแบบข้อความให้สวยงาม (ถ้าเป็น JSON)
    let isVibration = false;
    let isFallen = false;
    let displayMsg = rawMsg; 
    let displayTitle = "";

    // 🛡️ แกะกล่อง JSON เพื่อเอาข้อมูลมาแสดงให้ User อ่านง่าย
    try {
      if (rawMsg.startsWith('{')) {
        const parsed = JSON.parse(rawMsg);
        if (parsed.event === 'BUMP_DETECTED') {
          isVibration = true;
          displayMsg = `แรงสั่นสะเทือนระดับ: ${parsed.vib || 'ไม่ระบุ'}`;
        }
        else if (parsed.event === 'FALLEN_DETECTED') {
          isFallen = true;
          displayTitle = "🚨 แจ้งเตือน: รถล้ม!";
          displayMsg = `รถเอียงผิดปกติ! (องศา: ${parsed.deg || 0}, สั่น: ${parsed.vib || 0})`;
        }
      }
    } catch (e) { /* ไม่ใช่ JSON ปล่อยผ่านเป็น String ธรรมดา */ }

    // --- 🚨 [MAIN ALERT] หน้าแดง + ไซเรน ---
    if (isFallen || msg.includes("THEFT") || msg.includes("GEOFENCE") || msg.includes("FALLEN")) {
      
      alertState.deviceId = data.deviceId;
      
      // ✅ กำหนดหัวข้อและข้อความให้ตรงกับเหตุการณ์
      if (isFallen || msg.includes("FALLEN")) {
          alertState.title = displayTitle || "🚨 แจ้งเตือน: รถล้ม!";
          alertState.message = displayMsg; // โชว์ข้อความที่แกะจาก JSON แล้ว
      } else if (msg.includes("THEFT")) {
          alertState.title = "🚨 ตรวจพบการโจรกรรม!";
          alertState.message = rawMsg;
      } else {
          alertState.title = "⚠️ แจ้งเตือนเหตุร้าย!";
          alertState.message = rawMsg;
      }
      
      setTimeout(() => {
        alertState.show = true;
        audio.play().catch(() => console.warn("Audio blocked: User interaction required"));
      }, 100);

      setupToast({ title: 'Critical Alert!', message: alertState.message, type: 'error' });
    } 

    // --- 🔔 [TOAST ALERT] แจ้งเตือนสถานะทั่วไป ---
    else {
      if (msg.includes("BATTERY")) {
        setupToast({ title: 'Battery Warning', message: 'แบตเตอรี่อุปกรณ์ใกล้หมด!', type: 'warning', icon: '🪫' });
      } 
      else if (isVibration || msg.includes("BUMP") || msg.includes("DETECTED")) {
        setupToast({ title: 'ตรวจพบการสั่นสะเทือน', message: displayMsg, type: 'warning', icon: '⚠️' });
      }
      else {
        setupToast({ title: 'System Notification', message: rawMsg, type: 'info' });
      }
    }
  });
});

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