<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      
      <div class="bg-[#1e293b] w-full max-w-md rounded-3xl shadow-2xl shadow-blue-900/20 border border-slate-700/50 overflow-hidden relative transform transition-all">
        
        <div class="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent pointer-events-none"></div>

        <button @click="closeModal" class="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors z-10">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="p-8 relative z-0">
          
          <div class="flex flex-col items-center mb-8">
            <div class="relative group">
              <div class="w-24 h-24 rounded-full bg-slate-800 border-4 border-[#0f172a] shadow-xl flex items-center justify-center text-4xl font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-600 ring-2 ring-blue-500/30 group-hover:ring-blue-400/60 transition-all duration-500">
                {{ getInitials(form.name || form.username) }}
              </div>
              <div class="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#1e293b]"></div>
            </div>
            <h2 class="mt-4 text-xl font-bold text-white tracking-wide">{{ form.username || 'User' }}</h2>
            <p class="text-xs font-mono text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded mt-1 border border-slate-700/50">
              USER ID: {{ form.id || 'N/A' }}
            </p>
          </div>

          <div class="space-y-5">
            
            <div class="group">
              <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider ml-1">ชื่อที่แสดง (Display Name)</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input 
                  v-model="form.name" 
                  type="text"  
                  class="w-full pl-10 pr-4 py-3 bg-[#0f172a] text-slate-200 border border-slate-700/50 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600"
                  placeholder="กรอกชื่อของคุณ"
                />
              </div>
            </div>

            <div class="group">
              <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider ml-1">อีเมล (Email)</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input 
                  v-model="form.email" 
                  type="email"  
                  class="w-full pl-10 pr-4 py-3 bg-[#0f172a] text-slate-200 border border-slate-700/50 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600"
                  placeholder="name@example.com"
                />
              </div>
              <p class="text-[10px] text-amber-500/80 mt-1.5 ml-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                ใช้สำหรับรับการแจ้งเตือน
              </p>
            </div>

            <div class="group">
              <label class="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider ml-1">เบอร์โทรศัพท์</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input 
                  v-model="form.phone" 
                  @input="handlePhoneInput"
                  type="tel" 
                  maxlength="10"
                  class="w-full pl-10 pr-4 py-3 bg-[#0f172a] text-slate-200 border border-slate-700/50 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder-slate-600"
                  placeholder="08XXXXXXXX"
                />
              </div>
            </div>

          </div>
        </div>

        <div class="p-6 bg-[#0f172a]/50 border-t border-slate-700/50 flex justify-between items-center gap-3">
            <button @click="closeModal" class="px-6 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 font-medium transition-all text-sm">
              ยกเลิก
            </button>
            <button @click="saveProfile" :disabled="isLoading" class="flex-1 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-900/30 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2">
              <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
              {{ isLoading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
            </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import api from "../api";

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(["close", "saved", "toast"]); // เพิ่ม event toast

const isLoading = ref(false);
const form = reactive({
  id: "",
  username: "",
  name: "",
  email: "",
  phone: "",
});

const getInitials = (name) => {
  return name ? name.charAt(0).toUpperCase() : "?";
};

// โหลดข้อมูลเมื่อเปิด Modal
watch(() => props.isOpen, async (newVal) => {
    if (newVal) {
      // 1. ลองดึงจาก LocalStorage ก่อน (ให้แสดงผลไวๆ)
      const stored = localStorage.getItem('user');
      if(stored) {
         const u = JSON.parse(stored);
         form.username = u.username;
         form.name = u.name;
         form.phone = u.phone;
         form.email = u.email;
         form.id = u.id;
      }

      // 2. ดึงจาก API ล่าสุด
      try {
        const res = await api.get("/auth/me");
        const u = res.data.user || res.data;
        form.id = u.id;
        form.username = u.username;
        form.name = u.name || "";
        form.email = u.email || "";
        form.phone = u.phone || "";
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    }
});

const handlePhoneInput = (e) => {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length > 10) value = value.slice(0, 10);
  form.phone = value;
  e.target.value = value;
};

const saveProfile = async () => {
  isLoading.value = true;
  try {
    // 🔥 แก้ตรงนี้แล้ว: เปลี่ยนจาก /users/profile เป็น /auth/me
    const res = await api.put("/auth/me", { 
      name: form.name,
      email: form.email,
      phone: form.phone,
    });

    const updatedUser = res.data.user || res.data;
    localStorage.setItem("user", JSON.stringify(updatedUser));

    // ส่ง event กลับไปบอก SideBar
    emit("toast", { title: "สำเร็จ", msg: "บันทึกข้อมูลเรียบร้อย", type: "success" });
    emit("saved", updatedUser);
    emit("close");
    
  } catch (err) {
    emit("toast", { title: "ผิดพลาด", msg: "บันทึกไม่สำเร็จ", type: "error" });
    alert(err.response?.data?.message || "บันทึกไม่สำเร็จ");
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => emit("close");
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>