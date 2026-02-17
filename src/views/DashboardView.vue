<template>
  <div class="flex h-dvh w-screen overflow-hidden bg-slate-100 font-sans relative">
    
    <SideBar
      class="hidden md:flex flex-none w-72 z-[100] shadow-xl border-r border-slate-800"
      :activeDeviceId="currentDeviceId"
      :devices="devicesArray"
      :isOwner="isOwner"
      @select-device="handleSelectDevice"
      @logout="handleLogout"
      @add-device="showAddDeviceModal = true"
      @delete-device="handleDirectDelete"
      @edit-device="openSettingsModal"
      @share-device="handleOpenShare"
      @open-geofence="openGeofencePanel"
      @view-history="goToHistory"
      @find-bike="findMyBike"
      @toast="triggerToast"
    />

    <div
      v-show="isMobileMenuOpen"
      @click="isMobileMenuOpen = false"
      class="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm md:hidden"
    ></div>

    <div
      v-show="isMobileMenuOpen"
      class="fixed inset-y-0 left-0 z-[120] w-[80vw] max-w-xs h-full shadow-2xl md:hidden"
    >
      <SideBar
        class="w-full h-full"
        :activeDeviceId="currentDeviceId"
        :devices="devicesArray"
        :isOwner="isOwner"
        @select-device="(id) => { handleSelectDevice(id); isMobileMenuOpen = false; }"
        @logout="handleLogout"
        @add-device="showAddDeviceModal = true"
        @delete-device="handleDirectDelete"
        @edit-device="openSettingsModal"
        @share-device="handleOpenShare"
        @open-geofence="openGeofencePanel"
        @view-history="goToHistory"
        @find-bike="findMyBike"
        @toast="triggerToast"
      />
    </div>

    <div class="flex-1 relative w-full h-full overflow-hidden bg-slate-200">
      
      <div v-show="!isMobileMenuOpen" class="md:hidden absolute top-5 left-5 right-5 z-[500] flex items-center justify-between pointer-events-none">
        <button
          @click="isMobileMenuOpen = true"
          class="pointer-events-auto flex items-center justify-center w-12 h-12 bg-[#0f172a] text-slate-300 rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.4)] border border-slate-700 active:scale-95 transition-all hover:bg-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      <div class="absolute inset-0 z-0">
        <MapViewer
          ref="mapViewerRef"
          :data="validDevicesArray"
          :geofence="displayGeofence"
          :isEditing="showGeofencePanel && isOwner"
          @update:center="handleMapCenterUpdate"
          class="w-full h-full"
        />

        <div
          v-show="devicesArray.length === 0"
          class="absolute inset-0 z-[50] flex flex-col items-center justify-center p-6 text-center bg-slate-900"
        >
          <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <h2 class="text-xl font-bold text-white mb-2">ยังไม่มีรถในระบบ</h2>
          <p class="text-sm text-slate-400 max-w-xs">เปิดเมนูด้านซ้ายเพื่อทำการเพิ่มอุปกรณ์ GPS ของคุณ</p>
        </div>
      </div>

      <StatusCard
         v-show="!showGeofencePanel && devicesArray.length > 0"
         :vehicle="currentVehicle"
         @focus="handleFocusCar"
      />

      <GeofencePanel
        v-show="showGeofencePanel"
        :isOpen="showGeofencePanel"
        :geofenceData="draftGeofence"
        :loading="isSending"
        :readOnly="!isOwner"
        @update:data="(val) => Object.assign(draftGeofence, val)"
        @save="saveGeofence"
        @close="showGeofencePanel = false"
        @zoom-to-car="handleZoomToCar"
        @disable-geofence="handleDisableGeofence"
      />

      <AddDeviceModal v-if="showAddDeviceModal && isOwner" :isOpen="showAddDeviceModal" @close="showAddDeviceModal = false" @added="handleDeviceAdded" class="z-[9999]" />
      <EditDeviceModal v-if="showSettingsModal && isOwner" :isOpen="showSettingsModal" :device="editingDevice" @close="showSettingsModal = false" @updated="handleDeviceUpdated" @deleted="handleDeviceDeleted" @toast="triggerToast" class="z-[9999]" />
      <ShareDeviceModal v-if="showShareModal" :isOpen="showShareModal" :device="sharingDevice" @close="showShareModal = false" @toast="triggerToast" class="z-[9999]" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import api from "../api";
import { socket } from "../services/socket";

import SideBar from "../components/Side.vue";
import MapViewer from "../components/MapViewer.vue";
import AddDeviceModal from "../components/AddDeviceModal.vue";
import EditDeviceModal from "../components/EditDeviceModal.vue";
import ShareDeviceModal from "../components/ShareDeviceModal.vue";
import GeofencePanel from "../components/GeofencePanel.vue";
import StatusCard from "../components/StatusCard.vue";

const router = useRouter();

const isOwner = ref(false);
const vehicles = reactive({});
const currentDeviceId = ref("");
const mapViewerRef = ref(null);
const isMobileMenuOpen = ref(false);
const isSending = ref(false);
let checkInterval = null;

const draftGeofence = reactive({
  enabled: false,
  radius: 200,
  lat: 13.7563,
  lng: 100.5018,
});
const showGeofencePanel = ref(false);
const showAddDeviceModal = ref(false);
const showSettingsModal = ref(false);
const showShareModal = ref(false);
const editingDevice = ref(null);
const sharingDevice = ref(null);

const devicesArray = computed(() => Object.values(vehicles));
const validDevicesArray = computed(() => {
  return devicesArray.value.filter((v) => {
    const lat = parseFloat(v.lat);
    const lng = parseFloat(v.lng);
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  });
});

const hasLocation = computed(() => validDevicesArray.value.length > 0);
const currentVehicle = computed(() => vehicles[currentDeviceId.value] || {});
const displayGeofence = computed(() => {
  if (showGeofencePanel.value) return draftGeofence;
  const v = vehicles[currentDeviceId.value];
  return v?.geofence || { enabled: false, lat: 0, lng: 0, radius: 200 };
});

const triggerToast = (arg1, arg2, arg3, arg4) => {
  let detail =
    typeof arg1 === "object"
      ? { ...arg1 }
      : { title: arg1, message: arg2, icon: arg3, type: arg4 || "info" };
  window.dispatchEvent(new CustomEvent("global-toast", { detail }));
};

const calculateStatus = (rawIgn, lastUpdateDate) => {
  const isIgnOn = ["ON", "on", true, 1, "1"].includes(rawIgn);
  const diffMinutes = (Date.now() - new Date(lastUpdateDate).getTime()) / 1000 / 60;

  if (diffMinutes > 5) return "OFFLINE";
  if (rawIgn === "PARKED") return "PARKED";
  return isIgnOn ? "ONLINE" : "PARKED";
};

const startOfflineCheck = () => {
  if (checkInterval) clearInterval(checkInterval);
  checkInterval = setInterval(() => {
    const now = Date.now();
    Object.keys(vehicles).forEach((id) => {
      const v = vehicles[id];
      if (!v.lastUpdate) return;
      const diffMinutes = (now - new Date(v.lastUpdate).getTime()) / 1000 / 60;
      if (v.status !== "OFFLINE" && diffMinutes > 5) {
        // ใช้ Object.assign เพื่อการันตี Reactivity
        Object.assign(v, {
          status: "OFFLINE",
          ign: false,
          speed: 0
        });
      }
    });
  }, 10000);
};

const fetchInitialData = async () => {
  try {
    const res = await api.get("/devices");
    let devicesList = Array.isArray(res.data) ? res.data : res.data?.data || [];

    Object.keys(vehicles).forEach((key) => delete vehicles[key]);

    devicesList.forEach((d) => {
      const lastLoc = d.locationHistory?.length > 0 ? d.locationHistory[0] : null;
      const rawIgn = lastLoc?.ign ?? d.ign ?? "OFF";
      const lastUpdateDate = new Date(lastLoc?.createdAt || d.updatedAt || new Date());

      vehicles[d.deviceId] = {
        id: d.deviceId,
        name: d.name || `Device ${d.deviceId}`,
        lat: parseFloat(lastLoc?.lat || d.lat || 0),
        lng: parseFloat(lastLoc?.lng || d.lng || 0),
        speed: Number(lastLoc?.speed || d.speed || 0),
        status: calculateStatus(rawIgn, lastUpdateDate),
        ign: ["ON", "on", true, 1, "1"].includes(rawIgn),
        lastUpdate: lastUpdateDate,
        battery: Number(d.currentBattery ?? d.battery ?? 0),
        geofence: {
          enabled: !!d.isGeofenceActive,
          lat: parseFloat(d.geofenceLat || 0),
          lng: parseFloat(d.geofenceLng || 0),
          radius: Number(d.geofenceRadius || 200),
        },
      };
    });

    if (!currentDeviceId.value && devicesList.length > 0) {
      currentDeviceId.value = devicesList[0].deviceId;
    }
  } catch (e) {
    console.error("Fetch Data Error:", e);
  }
};

const handleSelectDevice = (id) => {
  currentDeviceId.value = id;
  const v = vehicles[id];
  if (v && mapViewerRef.value) {
    const lat = parseFloat(v.lat);
    if (!isNaN(lat) && lat !== 0) {
      mapViewerRef.value.focusCar(id);
    }
  }
};

const handleFocusCar = () => {
  if (currentDeviceId.value && mapViewerRef.value)
    mapViewerRef.value.focusCar(currentDeviceId.value);
};

const handleDeviceAdded = () => {
  showAddDeviceModal.value = false;
  fetchInitialData();
  triggerToast("สำเร็จ", "เพิ่มอุปกรณ์เรียบร้อย", "🎉", "success");
};

const openSettingsModal = (device) => {
  editingDevice.value = vehicles[device.deviceId || device.id] || device;
  showGeofencePanel.value = false;
  isMobileMenuOpen.value = false;
  showSettingsModal.value = true;
};

const handleOpenShare = (device) => {
  const id = device.deviceId || device.id;
  if (id) router.push(`/sharing-management/${id}`);
  else triggerToast("ผิดพลาด", "ไม่พบรหัสอุปกรณ์", "❌", "error");
  isMobileMenuOpen.value = false;
};

const handleDeviceUpdated = (newData) => {
  if (vehicles[newData.id]) {
    vehicles[newData.id].name = newData.name;
  }
  triggerToast("บันทึกแล้ว", "บันทึกข้อมูลเรียบร้อย", "💾", "success");
};

const handleDeviceDeleted = (id) => {
  delete vehicles[id];
  triggerToast("ลบแล้ว", "ลบอุปกรณ์ออกจากระบบแล้ว", "🗑️", "warning");
  if (currentDeviceId.value === id) {
    const keys = Object.keys(vehicles);
    currentDeviceId.value = keys.length > 0 ? keys[0] : "";
  }
};

const handleDirectDelete = async (device) => {
  if (!confirm(`ยืนยันการลบ "${device.name || device.id}"?`)) return;
  try {
    await api.delete(`/devices/${device.id}`);
    handleDeviceDeleted(device.id);
  } catch (e) {
    triggerToast("ผิดพลาด", "ลบไม่สำเร็จ", "❌", "error");
  }
};

const goToHistory = (id) => router.push(`/history/${id}`);

const findMyBike = async (id) => {
  try {
    await api.post(`/devices/${id || currentDeviceId.value}/command`, {
      command: "find_bike",
      value: 1,
    });
    triggerToast("สำเร็จ", "ส่งสัญญาณตามหาแล้ว", "📢", "info");
  } catch (e) {
    triggerToast("ผิดพลาด", "ส่งคำสั่งไม่สำเร็จ", "❌", "error");
  }
};

const openGeofencePanel = () => {
  const v = vehicles[currentDeviceId.value];
  if (v) {
    // 💡 FIX: ถ้ายังไม่เคยเซ็ต Geofence (lat เป็น 0) ให้ดึงพิกัดรถปัจจุบันมาแสดงแทน
    const hasGeofence = v.geofence && v.geofence.lat !== 0;
    Object.assign(draftGeofence, {
      enabled: v.geofence?.enabled || false,
      radius: v.geofence?.radius || 200,
      lat: hasGeofence ? v.geofence.lat : v.lat,
      lng: hasGeofence ? v.geofence.lng : v.lng,
    });
  }
  showGeofencePanel.value = true;
  isMobileMenuOpen.value = false;
  
  if (mapViewerRef.value && draftGeofence.lat !== 0) {
    mapViewerRef.value.focusLatLn(draftGeofence.lat, draftGeofence.lng, 15);
  }
};

const handleZoomToCar = () => {
  const v = vehicles[currentDeviceId.value];
  if (v && mapViewerRef.value) {
    draftGeofence.lat = v.lat;
    draftGeofence.lng = v.lng;
    if (window.innerWidth < 768)
      mapViewerRef.value.focusCarWithOffset(v.id, 150);
    else mapViewerRef.value.focusCar(v.id);
  }
};

const handleDisableGeofence = async () => {
  if (!isOwner.value) return;
  draftGeofence.enabled = false;
  await saveGeofence();
};

const saveGeofence = async () => {
  if (!isOwner.value) return;
  isSending.value = true;
  try {
    await api.put(`/devices/${currentDeviceId.value}`, {
      geofence: { ...draftGeofence },
    });
    if (vehicles[currentDeviceId.value]) {
      vehicles[currentDeviceId.value].geofence = { ...draftGeofence };
    }
    triggerToast(
      "สำเร็จ",
      draftGeofence.enabled ? "บันทึก Geofence สำเร็จ" : "ปิดแจ้งเตือน Geofence แล้ว",
      "✅",
      "success"
    );
    if (draftGeofence.enabled) showGeofencePanel.value = false;
  } catch (e) {
    triggerToast("ผิดพลาด", "บันทึกผิดพลาด", "❌", "error");
  } finally {
    isSending.value = false;
  }
};

const handleMapCenterUpdate = (center) => {
  if (showGeofencePanel.value && isOwner.value) {
    draftGeofence.lat = center.lat;
    draftGeofence.lng = center.lng;
  }
};

const handleLogout = () => {
  localStorage.removeItem("token");
  router.push("/login");
};

onMounted(async () => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      // Note: เช็คให้ดีว่า payload.role เป็นตัวแปรที่ใช้เช็ค Owner ในระบบคุณถูกต้องหรือไม่
      isOwner.value = payload.role === "ADMIN";
    }
  } catch (e) {
    isOwner.value = false;
  }

  await fetchInitialData();
  startOfflineCheck();

  socket.on("new_location", (data) => {
    if (vehicles[data.deviceId]) {
      const lat = parseFloat(data.lat);
      const lng = parseFloat(data.lng);
      const isIgnOn = ["ON", "on", true, 1, "1"].includes(data.ign);
      
      // 💡 FIX THE SYNC BUG: อัปเดตสถานะ เครื่องยนต์ และแบตเตอรี่ *เสมอ* (แม้ GPS จะไม่มีสัญญาณ)
      const updates = {
        ign: isIgnOn,
        status: calculateStatus(data.ign, new Date()),
        lastUpdate: new Date(),
        battery: Number(data.battery ?? data.batt ?? vehicles[data.deviceId].battery),
      };

      // 💡 อัปเดตพิกัดบนแผนที่ *เฉพาะ* ตอนที่ GPS จับสัญญาณได้จริงเท่านั้น (ไม่เป็น 0)
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        updates.lat = lat;
        updates.lng = lng;
        updates.speed = Number(data.speed);
      }

      // นำข้อมูลทั้งหมดเทรวมเพื่ออัปเดตแบบรวดเดียว Vue จะจับ Reactivity ได้สมบูรณ์
      Object.assign(vehicles[data.deviceId], updates);
    }
  });
});

onUnmounted(() => {
  socket.off("new_location");
  if (checkInterval) clearInterval(checkInterval);
});
</script>