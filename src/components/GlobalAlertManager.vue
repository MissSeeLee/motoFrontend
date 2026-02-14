<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api'; 
// 🔌 ดึงตัว socket มาโดยตรง ไม่ผ่าน socketState
import { socket } from '../services/socket';

const router = useRouter();

// --- State ---
const criticalAlert = ref(null);
const toasts = ref([]);
let toastId = 0;
let sirenAudio = null;

onMounted(() => {
  console.log("✅ [Manager] GlobalAlertManager mounted and ready!"); // เช็คว่า Component ถูกโหลดไหม

  sirenAudio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
  sirenAudio.loop = true;

  // 👂 ดักฟังจากท่อ Socket โดยตรง (ไม่ผ่านตัวแปรกลาง เพื่อความชัวร์)
  socket.on("new_alert", (data) => {
    console.log("🚀 [Manager] DIRECT RECEIVE:", data);
    processIncomingAlert(data);
  });

  // 🧪 ตัวทดสอบ (พิมพ์ window.triggerTest() ใน Console)
  window.triggerTest = () => {
    processIncomingAlert({ 
        type: 'THEFT', 
        deviceId: 'TEST-DEVICE',
        message: 'THEFT_DETECTED', 
        icon: '🚨'
    });
  };
});

onUnmounted(() => { 
  socket.off("new_alert"); // ลบ listener เมื่อปิด
  stopSiren(); 
});

const processIncomingAlert = (data) => {
  const msg = (data.message || "").toUpperCase();
  const type = (data.type || "").toUpperCase();
  
  console.log(`🧐 [Manager] Evaluating: "${msg}"`);

  // ✅ เงื่อนไขเด้งหน้าต่างแดง (Critical)
  const isCritical = ['THEFT', 'CRASH', 'FALLEN', 'GEOFENCE', 'DETECTED', 'ACCIDENT']
                     .some(key => msg.includes(key) || type.includes(key));

  if (isCritical) {
    console.log("🚨 [Manager] BINGO! Showing Modal.");
    criticalAlert.value = {
      ...data,
      title: msg.includes('THEFT') ? 'ตรวจพบการโจรกรรม!' : 'แจ้งเตือนเหตุร้าย!',
      icon: msg.includes('ACCIDENT') ? '🚑' : '🚨'
    };
    playSiren();
  } else {
    console.log("🟡 [Manager] Info Alert. Showing Toast.");
    showToast(data.title || 'แจ้งเตือนระบบ', data.message, 'warning');
  }
};

// ... ส่วนฟังก์ชันอื่นๆ (muteVehicle, goToTracking, etc.) เหมือนเดิมที่คุณมี ...
const muteVehicle = async () => {
  if (!criticalAlert.value) return;
  try {
    await api.post(`/devices/${criticalAlert.value.deviceId}/command`, { command: "stop_alarm", value: 1 });
    showToast('สำเร็จ', 'ส่งคำสั่งปิดเสียงรถแล้ว', 'info');
  } catch (error) {
    showToast('ผิดพลาด', 'ไม่สามารถปิดเสียงรถได้', 'warning');
  }
};

const goToTracking = () => {
  if (!criticalAlert.value) return;
  const devId = criticalAlert.value.deviceId;
  dismissAlert();
  router.push(`/track/${devId}`);
};

const dismissAlert = () => {
  criticalAlert.value = null;
  stopSiren();
};

const showToast = (title, message, type = 'info') => {
  const id = toastId++;
  toasts.value.push({ id, title, message, type });
  setTimeout(() => removeToast(id), 5000);
};

const removeToast = (id) => toasts.value = toasts.value.filter(t => t.id !== id);
const playSiren = () => { if (sirenAudio) sirenAudio.play().catch(e => console.warn("Siren blocked:", e)); };
const stopSiren = () => { if (sirenAudio) { sirenAudio.pause(); sirenAudio.currentTime = 0; } };
</script>