<template>
  <div class="h-full bg-[#0f172a] text-slate-300 flex flex-col font-sans overflow-hidden border-r border-slate-800 shadow-2xl relative z-40">
    
    <div class="p-6 pb-4 flex items-center gap-4 bg-[#0f172a] z-10">
      <div @click="openProfileModal" class="relative group cursor-pointer flex items-center gap-4 w-full hover:bg-slate-800/50 p-2 -ml-2 rounded-xl transition-all">
        
        <div class="relative">
          <div class="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 ring-1 ring-slate-700/50 shadow-lg group-hover:ring-blue-500/50 group-hover:bg-slate-750 transition-all duration-300">
             <span class="text-lg font-bold">{{ (userProfile.name || 'U').charAt(0).toUpperCase() }}</span>
          </div>
          <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0f172a] rounded-full flex items-center justify-center">
             <div class="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-base text-white tracking-wide truncate group-hover:text-blue-400 transition-colors">
             {{ userProfile.name || (isOwner ? 'My Devices' : 'Driver Mode') }}
          </h3>
          <div class="flex items-center gap-2 mt-1">
             <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ONLINE</span>
             <span class="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">แตะเพื่อแก้ไข</span>
          </div>
        </div>
      </div>
    </div>

    <div class="px-6 py-2">
       <div class="flex justify-between items-end text-[11px] text-slate-500 font-bold tracking-widest uppercase border-b border-slate-800 pb-2">
         <span>{{ isOwner ? 'All Vehicles' : 'Assigned' }}</span>
         <span class="bg-slate-800 text-slate-200 px-2 py-0.5 rounded-md min-w-[24px] text-center shadow-sm">
           {{ devices ? Object.keys(devices).length : 0 }}
         </span>
       </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-2 space-y-3 custom-scrollbar">
       <div v-for="(device, key) in devices" :key="key"
           @click="$emit('select-device', device.deviceId || device.id)"
           class="relative group rounded-2xl p-3 transition-all duration-300 border cursor-pointer overflow-hidden"
           :class="isActive(device) 
             ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
             : 'bg-[#1e293b]/40 border-slate-700/30 hover:border-slate-600 hover:bg-[#1e293b]'">
           
           <button v-if="isOwner" @click.stop="$emit('delete-device', device)" class="absolute top-2 right-2 z-30 p-1.5 rounded-full text-slate-500 bg-slate-800/50 hover:bg-rose-500 hover:text-white transition-all duration-200 transform hover:scale-110 shadow-sm border border-slate-700/50 hover:border-rose-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           
           <div v-if="isActive(device)" class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-500 shadow-[0_0_10px_#3b82f6]"></div>

           <div class="flex items-start gap-3 mb-3 pl-2 relative z-10">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner transition-all duration-300"
                   :class="isActive(device) ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-900/40 scale-105' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300 group-hover:bg-slate-700'">🛵</div>
              <div class="flex-1 min-w-0 pt-0.5 pr-6"> 
                 <h3 class="font-bold text-sm truncate transition-colors" :class="isActive(device) ? 'text-white' : 'text-slate-300 group-hover:text-white'">{{ device.name || 'Unknown Device' }}</h3>
                 <div class="flex justify-between items-center mt-0.5">
                    <p class="text-[10px] font-mono text-slate-500 truncate opacity-70">ID: {{ (device.deviceId || device.id || '').slice(0,8) }}...</p>
                    <span v-if="isActive(device)" class="text-[9px] text-blue-400 font-bold animate-pulse">● Monitoring</span>
                 </div>
              </div>
           </div>

           <div class="grid gap-1 mt-2 pt-3 border-t border-slate-700/30 px-1 relative z-10" :class="isOwner ? 'grid-cols-5' : 'grid-cols-3'">
               <button @click.stop="$emit('view-history', device.deviceId || device.id)" class="action-btn group/btn"><div class="icon-box group-hover/btn:bg-purple-500/20 group-hover/btn:text-purple-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div><span class="label-text">ประวัติ</span></button>
               <button @click.stop="$emit('find-bike', device.deviceId || device.id)" class="action-btn group/btn"><div class="icon-box group-hover/btn:bg-blue-500/20 group-hover/btn:text-blue-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg></div><span class="label-text">ตามหา</span></button>
               <button @click.stop="$emit('open-geofence', device)" class="action-btn group/btn"><div class="icon-box group-hover/btn:bg-amber-500/20 group-hover/btn:text-amber-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="currentColor" class="opacity-50"/></svg></div><span class="label-text">ขอบเขต</span></button>
               <button v-if="isOwner" @click.stop="$emit('edit-device', device)" class="action-btn group/btn"><div class="icon-box group-hover/btn:bg-teal-500/20 group-hover/btn:text-teal-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></div><span class="label-text">แก้ไข</span></button>
               <button v-if="isOwner" @click.stop="$emit('share-device', device)" class="action-btn group/btn"><div class="icon-box group-hover/btn:bg-pink-500/20 group-hover/btn:text-pink-400"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg></div><span class="label-text">กุญแจ</span></button>
           </div>
       </div>

       <div v-if="isOwner" class="pt-4 pb-2">
            <button @click="$emit('add-device')" class="group relative w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 shadow-lg shadow-indigo-900/30 transition-all duration-300 ease-out hover:shadow-indigo-900/50 hover:-translate-y-1 overflow-hidden">
                <div class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></div>
                <span class="text-sm font-bold text-white tracking-wide">เพิ่มอุปกรณ์ใหม่</span>
            </button>
       </div>
    </div>

    <div class="p-4 mt-auto border-t border-slate-800/50 bg-[#0f172a] z-10">
        <button @click="$emit('logout')" class="group flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-rose-500/10 hover:border-rose-500/30 border border-transparent transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 group-hover:text-rose-500 transition-colors"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
            <span class="group-hover:text-rose-400">SIGN OUT</span>
        </button>
    </div>

    <div v-if="isProfileModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="bg-[#1e293b] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 animate-fade-in-up relative">
        <div class="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/10 pointer-events-none"></div>

        <div class="p-6 relative z-10">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    <span class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </span>
                    แก้ไขข้อมูลส่วนตัว
                </h3>
                <button @click="closeProfileModal" class="text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-rose-500/20 p-1.5 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div class="space-y-4">
                <div class="space-y-1">
                    <label class="text-xs font-bold text-slate-400 uppercase ml-1">ชื่อที่แสดง</label>
                    <div class="relative group">
                         <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                         </div>
                         <input v-model="editForm.name" type="text" class="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner" placeholder="ชื่อของคุณ">
                    </div>
                </div>

                <div class="space-y-1">
                    <label class="text-xs font-bold text-slate-400 uppercase ml-1">อีเมล (Email)</label>
                    <div class="relative group">
                         <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                         </div>
                         <input v-model="editForm.email" type="email" class="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner" placeholder="name@example.com">
                    </div>
                </div>

                <div class="space-y-1">
                    <label class="text-xs font-bold text-slate-400 uppercase ml-1">เบอร์โทรศัพท์</label>
                    <div class="relative group">
                         <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                         </div>
                         <input v-model="editForm.phone" type="tel" maxlength="10" class="w-full pl-10 pr-4 py-2.5 bg-[#0f172a] border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner" placeholder="08xxxxxxxx">
                    </div>
                </div>
            </div>

            <div class="mt-8 pt-4 border-t border-slate-700/50 flex gap-3">
                <button @click="closeProfileModal" class="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors">ยกเลิก</button>
                <button @click="updateProfile" :disabled="isLoading" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <span v-if="isLoading" class="loading loading-spinner loading-xs"></span>
                    {{ isLoading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
                </button>
            </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '../api';

const props = defineProps({
  devices: { type: Object, default: () => ({}) },
  activeDeviceId: { type: String, default: '' },
  isOwner: { type: Boolean, default: false }
});

const emit = defineEmits(['select-device', 'logout', 'add-device', 'delete-device', 'edit-device', 'open-geofence', 'view-history', 'find-bike', 'share-device']);

// --- Profile Logic ---
const isProfileModalOpen = ref(false);
const isLoading = ref(false);
const userProfile = reactive({
  name: '',
  email: '',  // ✅ เพิ่ม
  phone: ''
});
const editForm = reactive({
  name: '',
  email: '', // ✅ เพิ่ม
  phone: ''
});

// Helper เช็ค Active
const isActive = (device) => {
  const id = device.deviceId || device.id;
  return props.activeDeviceId === id;
};

// ดึงข้อมูลผู้ใช้
const fetchUserProfile = async () => {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    userProfile.name = parsed.name || parsed.username || 'User';
    userProfile.email = parsed.email || ''; // ✅ เพิ่ม
    userProfile.phone = parsed.phone || parsed.phoneNumber || '';
  }

  try {
    const res = await api.get('/auth/me'); 
    if (res.data) {
       const userData = res.data.user || res.data; 
       userProfile.name = userData.name;
       userProfile.email = userData.email; // ✅ เพิ่ม
       userProfile.phone = userData.phone;
       localStorage.setItem('user', JSON.stringify(userData));
    }
  } catch (e) {
    console.error("Failed to fetch fresh user profile", e);
  }
};

const openProfileModal = () => {
  editForm.name = userProfile.name;
  editForm.email = userProfile.email; // ✅ เพิ่ม
  editForm.phone = userProfile.phone;
  isProfileModalOpen.value = true;
};

const closeProfileModal = () => {
  isProfileModalOpen.value = false;
};

const updateProfile = async () => {
  if (!editForm.name) return alert('กรุณากรอกชื่อ');
  if (!editForm.email) return alert('กรุณากรอกอีเมล'); // ✅ เพิ่ม
  
  isLoading.value = true;
  try {
    const res = await api.put('/users/profile', {
      name: editForm.name,
      email: editForm.email, // ✅ ส่งไป Backend
      phone: editForm.phone
    });

    // อัพเดทหน้าจอ
    userProfile.name = editForm.name;
    userProfile.email = editForm.email;
    userProfile.phone = editForm.phone;

    // อัพเดท LocalStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const newUser = { ...storedUser, name: editForm.name, email: editForm.email, phone: editForm.phone };
    localStorage.setItem('user', JSON.stringify(newUser));

    alert('บันทึกข้อมูลเรียบร้อยแล้ว');
    closeProfileModal();
  } catch (e) {
    console.error(e);
    alert('เกิดข้อผิดพลาดในการบันทึก: ' + (e.response?.data?.message || e.message));
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchUserProfile();
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background-color: transparent; }

.action-btn { @apply flex flex-col items-center gap-1 py-1.5 rounded-lg transition-all duration-200; }
.icon-box { @apply p-1.5 rounded-lg bg-slate-700/30 text-slate-400 transition-all duration-300; }
.label-text { @apply text-[9px] font-medium text-slate-500 transition-colors; }

.action-btn:hover .label-text { @apply text-slate-300; }
.action-btn:active { @apply scale-95; }

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out forwards;
}
</style>