<template>
  <div class="h-dvh w-screen flex flex-col bg-slate-900 relative overflow-hidden font-sans text-slate-200">
    
    <div v-if="device?.currentStatus === 'THEFT'" class="absolute top-16 left-0 right-0 z-[50] px-4 pointer-events-none">
       <div class="bg-red-500/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border border-white/20">
          <span class="text-2xl">🚨</span>
          <div>
            <p class="text-[10px] uppercase font-black opacity-80 leading-none">Status Alert</p>
            <p class="font-bold">ตรวจพบการโจรกรรม! (Theft Detected)</p>
          </div>
       </div>
    </div>

    <div class="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
       <div class="flex justify-between items-center">
          <div class="pointer-events-auto bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/50 flex items-center gap-3 shadow-xl">
              <div class="flex flex-col">
                <h1 class="text-sm font-black tracking-tight text-white uppercase">{{ device?.name || 'Loading...' }}</h1>
                <div class="flex items-center gap-1.5 mt-0.5">
                   <span :class="`w-1.5 h-1.5 rounded-full ${status === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-500'}`"></span>
                   <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{{ status }}</span>
                </div>
              </div>
          </div>

          <div class="pointer-events-auto flex gap-2">
            <button @click="reCenterMap" class="w-10 h-10 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/50 flex items-center justify-center text-white shadow-xl active:scale-95 transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
            </button>
          </div>
       </div>
    </div>

    <div class="flex-1 relative z-0">
      <MapViewer 
        v-if="device"
        ref="mapRef"
        :data="vehicleList" 
        class="w-full h-full"
      />
      
      <div v-else class="flex flex-col items-center justify-center h-full bg-slate-900">
        <div class="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
        <p class="mt-4 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Searching Signal...</p>
      </div>
    </div>

    <div v-if="device" 
         class="relative z-30 bg-slate-900 border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] rounded-t-[2.5rem] transition-all duration-500"
         :class="isPanelExpanded ? 'pb-10 pt-2' : 'pb-6 pt-2'">
       
       <div @click="isPanelExpanded = !isPanelExpanded" class="w-full flex justify-center py-3 cursor-pointer">
          <div class="w-10 h-1 rounded-full bg-slate-700 transition-colors" :class="{'bg-indigo-500': isPanelExpanded}"></div>
       </div>

       <div class="px-6">
          <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-4">
                 <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
                    🛵
                 </div>
                 <div>
                    <h2 class="text-xl font-black text-white leading-none mb-1">{{ device.name }}</h2>
                    <p class="text-[10px] font-mono text-slate-500 tracking-tighter">ID: {{ device.deviceId }}</p>
                 </div>
              </div>
              <div class="text-right">
                  <div class="text-2xl font-black text-white leading-none">{{ speed }}</div>
                  <div class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">km/h</div>
              </div>
          </div>

          <div class="grid grid-cols-3 gap-3 mb-6">
             <div class="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl flex flex-col items-center">
                <span class="text-[9px] font-bold text-slate-500 uppercase mb-1">Battery</span>
                <span class="text-sm font-black text-white" :class="{'text-red-400': battery < 20}">{{ battery }}%</span>
             </div>
             <div class="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl flex flex-col items-center">
                <span class="text-[9px] font-bold text-slate-500 uppercase mb-1">Engine</span>
                <span class="text-sm font-black" :class="ign ? 'text-emerald-400' : 'text-slate-500'">{{ ign ? 'ON' : 'OFF' }}</span>
             </div>
             <div class="bg-slate-800/40 border border-slate-800 p-3 rounded-2xl flex flex-col items-center text-center">
                <span class="text-[9px] font-bold text-slate-500 uppercase mb-1">Signals</span>
                <span class="text-[10px] font-black text-indigo-400 leading-none mt-1">LOCKED</span>
             </div>
          </div>

          <div class="flex flex-col gap-3">
             <a :href="`https://www.google.com/maps/search/?api=1&query=${device.lat},${device.lng}`" 
                target="_blank"
                class="w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 text-indigo-600"><path fill-rule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 3.58-3.14c1.58-1.887 2.485-3.728 2.485-5.334 0-4.402-3.535-7.981-7.89-7.981-4.356 0-7.89 3.579-7.89 7.981 0 1.606.905 3.447 2.485 5.334a16.976 16.976 0 0 0 3.58 3.14ZM12 14.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clip-rule="evenodd" /></svg>
                Navigate to Vehicle
             </a>
             
             <button v-if="isPanelExpanded" @click="sendCommand('find_bike')" 
                class="w-full py-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 font-bold text-sm uppercase tracking-widest active:scale-95 transition-all">
                Trigger Alarm Signal
             </button>
          </div>

          <p class="text-center text-[9px] text-slate-600 mt-6 uppercase tracking-widest font-bold">
            Last Sync: {{ lastUpdateTime }}
          </p>
       </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue';
import { useRoute } from 'vue-router';
import { io } from "socket.io-client";
import api from '../api';
import MapViewer from '../components/MapViewer.vue';

const route = useRoute();
const token = route.params.token;

const device = ref(null);
const status = ref('CONNECTING');
const speed = ref(0);
const battery = ref(0);
const ign = ref(false);
const lastUpdateTime = ref('--:--:--');
const vehicleData = reactive({});
const isPanelExpanded = ref(false);
const mapRef = ref(null);

// Convert Object to Array for MapViewer
const vehicleList = computed(() => Object.values(vehicleData));

// Socket Setup
const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
const socket = io(socketUrl, {
  path: "/socket.io/",
  transports: ["websocket", "polling"],
});

const sendCommand = async (val) => {
  try {
    await api.post(`/devices/share/${token}/command`, { command: val });
    if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
  } catch (err) {
    alert("Error: " + (err.response?.data?.message || err.message));
  }
};

const reCenterMap = () => {
  if (mapRef.value && device.value) {
    mapRef.value.focusCar(device.value.deviceId);
  }
};

const updateClock = () => {
  lastUpdateTime.value = new Date().toLocaleTimeString('th-TH');
};

onMounted(async () => {
  if (!token) return;

  try {
    const res = await api.get(`/devices/public-info/${token}`);
    device.value = res.data;
    
    // Sync initial state
    battery.value = res.data.battery || 0;
    ign.value = !!res.data.ign;
    updateClock();

    vehicleData[device.value.deviceId] = {
        id: device.value.deviceId,
        name: device.value.name,
        lat: Number(res.data.lat), 
        lng: Number(res.data.lng),
        status: res.data.currentStatus || 'ONLINE', 
        speed: 0, 
        ign: ign.value
    };

    setTimeout(() => reCenterMap(), 1000);

    socket.on("connect", () => { status.value = "ONLINE"; });
    socket.on("new_location", (data) => {
        if (data.deviceId === device.value.deviceId) { 
            status.value = data.status || 'ONLINE';
            speed.value = data.speed || 0;
            battery.value = data.battery || battery.value;
            ign.value = !!data.ign;
            updateClock();

            vehicleData[device.value.deviceId] = {
                ...vehicleData[device.value.deviceId],
                lat: Number(data.lat), 
                lng: Number(data.lng),
                speed: speed.value, 
                ign: ign.value, 
                status: status.value
            };
        }
    });

  } catch (err) {
    console.error(err);
    status.value = "EXPIRED";
  }
});

onUnmounted(() => { if(socket) socket.disconnect(); });
</script>

<style scoped>
/* Smooth Scroll & Animations */
.animate-fade-in-up { 
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
}
@keyframes fadeInUp { 
  from { opacity: 0; transform: translateY(20px); } 
  to { opacity: 1; transform: translateY(0); } 
}

/* Hide Map UI default clutter if needed */
:deep(.leaflet-control-container) {
  display: none !important;
}
</style>