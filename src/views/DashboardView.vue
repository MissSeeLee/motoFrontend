<template>
  <div class="flex h-dvh w-screen overflow-hidden bg-slate-100 font-sans relative">
    <SideBar
      class="hidden md:flex flex-none w-72 z-30 shadow-xl border-r border-slate-200"
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

    <div v-if="isMobileMenuOpen" @click="isMobileMenuOpen = false" class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden transition-opacity"></div>

    <transition enter-active-class="transform transition ease-out duration-300" enter-from-class="-translate-x-full" enter-to-class="translate-x-0" leave-active-class="transform transition ease-in duration-300" leave-from-class="translate-x-0" leave-to-class="-translate-x-full">
      <SideBar
        v-if="isMobileMenuOpen"
        class="fixed inset-y-0 left-0 z-[70] w-[80vw] max-w-xs shadow-2xl md:hidden"
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
    </transition>

    <button @click="isMobileMenuOpen = true" class="md:hidden absolute top-4 left-4 z-40 btn btn-circle btn-sm bg-white shadow-md border-slate-100 text-slate-700">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
    </button>

    <div class="flex-1 relative w-full h-full overflow-hidden bg-slate-200">
      <MapViewer
        ref="mapViewerRef"
        :data="devicesArray"
        :geofence="displayGeofence"
        :isEditing="showGeofencePanel && isOwner"
        @update:center="handleMapCenterUpdate"
        class="absolute inset-0 w-full h-full z-0"
      />

      <StatusCard v-if="!showGeofencePanel" :vehicle="currentVehicle" @focus="handleFocusCar" />

      <GeofencePanel
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

      <AddDeviceModal v-if="showAddDeviceModal && isOwner" :isOpen="showAddDeviceModal" @close="showAddDeviceModal = false" @added="handleDeviceAdded" />
      <EditDeviceModal v-if="showSettingsModal && isOwner" :isOpen="showSettingsModal" :device="editingDevice" @close="showSettingsModal = false" @updated="handleDeviceUpdated" @deleted="handleDeviceDeleted" @toast="triggerToast" />
      <ShareDeviceModal v-if="showShareModal" :isOpen="showShareModal" :device="sharingDevice" @close="showShareModal = false" @toast="triggerToast" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import api from "../api";
import { socket } from "../services/socket.js"; // 🔌 ใช้ Socket กลางที่เชื่อมต่อถาวร

// Components
import SideBar from "../components/Side.vue";
import MapViewer from "../components/MapViewer.vue";
import AddDeviceModal from "../components/AddDeviceModal.vue";
import EditDeviceModal from "../components/EditDeviceModal.vue";
import ShareDeviceModal from "../components/ShareDeviceModal.vue";
import GeofencePanel from "../components/GeofencePanel.vue";
import StatusCard from "../components/StatusCard.vue";

const router = useRouter();

// --- States ---
const isOwner = ref(false);
const vehicles = reactive({});
const currentDeviceId = ref("");
const mapViewerRef = ref(null);
const isMobileMenuOpen = ref(false);
const isSending = ref(false);
let checkInterval = null; 

// Modals & Panels State
const draftGeofence = reactive({ enabled: false, radius: 200, lat: 13.7563, lng: 100.5018 });
const showGeofencePanel = ref(false);
const showAddDeviceModal = ref(false);
const showSettingsModal = ref(false);
const showShareModal = ref(false);
const editingDevice = ref(null);
const sharingDevice = ref(null);

// --- Computed ---
const devicesArray = computed(() => Object.values(vehicles));
const currentVehicle = computed(() => vehicles[currentDeviceId.value] || {});
const displayGeofence = computed(() => {
  if (showGeofencePanel.value) return draftGeofence;
  const v = vehicles[currentDeviceId.value];
  return v?.geofence || { enabled: false, lat: 0, lng: 0, radius: 200 };
});

// --- Logic Functions ---

const triggerToast = (arg1, arg2, arg3, arg4) => {
  let detail = {};
  if (typeof arg1 === "object") {
    detail = { ...arg1 };
  } else {
    detail = { title: arg1, message: arg2, icon: arg3, type: arg4 || 'info' };
  }
  // ส่งสัญญาณให้ App.vue (Global) เป็นคนโชว์ Toast
  window.dispatchEvent(new CustomEvent('global-toast', { detail }));
};

const startOfflineCheck = () => {
  if (checkInterval) clearInterval(checkInterval);
  checkInterval = setInterval(() => {
    const now = Date.now();
    Object.keys(vehicles).forEach((id) => {
      const v = vehicles[id];
      if (!v.lastUpdate) return;
      const diffMinutes = (now - new Date(v.lastUpdate).getTime()) / 1000 / 60;
      if (v.status === 'ONLINE' && diffMinutes > 5) {
        v.status = 'OFFLINE';
        v.ign = false;
        v.speed = 0;
      }
    });
  }, 10000);
};

const fetchInitialData = async () => {
  try {
    const res = await api.get("/devices");
    let devicesList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    
    Object.keys(vehicles).forEach((key) => delete vehicles[key]);
    const now = new Date();

    devicesList.forEach((d) => {
      const lastLoc = d.locationHistory?.length > 0 ? d.locationHistory[0] : null;
      const rawIgn = lastLoc?.ign ?? d.ign ?? "OFF";
      const lastUpdateDate = new Date(lastLoc?.createdAt || d.updatedAt || now);
      const diffMinutes = (now - lastUpdateDate) / 1000 / 60;

      let realStatus = d.currentStatus || "OFFLINE";
      if (rawIgn === "PARKED") realStatus = "PARKED";
      else if (realStatus === 'ONLINE' && diffMinutes > 5) realStatus = 'OFFLINE';

      vehicles[d.deviceId] = {
        id: d.deviceId,
        name: d.name || `Device ${d.deviceId}`,
        emergencyPhone: d.emergencyPhone || "",
        alarmDuration: Number(d.alarmDuration || 0),
        lat: Number(lastLoc?.lat || d.lat || 0),
        lng: Number(lastLoc?.lng || d.lng || 0),
        speed: Number(lastLoc?.speed || d.speed || 0),
        status: realStatus,
        ign: rawIgn === "ON",
        lastUpdate: lastUpdateDate,
        battery: Number(d.currentBattery ?? d.battery ?? 0),
        geofence: {
          enabled: !!d.isGeofenceActive,
          lat: Number(d.geofenceLat || 0),
          lng: Number(d.geofenceLng || 0),
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

// --- Handlers ---
const handleFocusCar = () => { if (currentDeviceId.value && mapViewerRef.value) mapViewerRef.value.focusCar(currentDeviceId.value); };
const handleDeviceAdded = () => { showAddDeviceModal.value = false; fetchInitialData(); triggerToast("สำเร็จ", "เพิ่มอุปกรณ์เรียบร้อย", "🎉", "success"); };
const openSettingsModal = (device) => { editingDevice.value = vehicles[device.deviceId || device.id] || device; showGeofencePanel.value = false; isMobileMenuOpen.value = false; showSettingsModal.value = true; };
const handleOpenShare = (device) => { const id = device.deviceId || device.id; if (id) router.push(`/sharing-management/${id}`); else triggerToast("ผิดพลาด", "ไม่พบรหัสอุปกรณ์", "❌", "error"); isMobileMenuOpen.value = false; };
const handleDeviceUpdated = (newData) => { if (vehicles[newData.id]) { vehicles[newData.id].name = newData.name; vehicles[newData.id].alarmDuration = newData.alarmDuration; } triggerToast("บันทึกแล้ว", "บันทึกข้อมูลเรียบร้อย", "💾", "success"); };
const handleDeviceDeleted = (id) => { delete vehicles[id]; triggerToast("ลบแล้ว", "ลบอุปกรณ์ออกจากระบบแล้ว", "🗑️", "warning"); if (currentDeviceId.value === id) { const keys = Object.keys(vehicles); currentDeviceId.value = keys.length > 0 ? keys[0] : ""; } };
const handleDirectDelete = async (device) => { if (!confirm(`ยืนยันการลบ "${device.name || device.id}"?`)) return; try { await api.delete(`/devices/${device.id}`); handleDeviceDeleted(device.id); } catch (e) { triggerToast("ผิดพลาด", "ลบไม่สำเร็จ", "❌", "error"); } };
const goToHistory = (id) => router.push(`/history/${id}`);
const findMyBike = async (id) => { try { await api.post(`/devices/${id || currentDeviceId.value}/command`, { command: "find_bike", value: 1 }); triggerToast("สำเร็จ", "ส่งสัญญาณตามหาแล้ว", "📢", "info"); } catch (e) { triggerToast("ผิดพลาด", "ส่งคำสั่งไม่สำเร็จ", "❌", "error"); } };

const openGeofencePanel = () => {
  const v = vehicles[currentDeviceId.value];
  if (v) Object.assign(draftGeofence, v.geofence || { lat: v.lat, lng: v.lng, radius: 200 });
  showGeofencePanel.value = true;
  isMobileMenuOpen.value = false;
  if (mapViewerRef.value && draftGeofence.lat !== 0) mapViewerRef.value.focusLatLn(draftGeofence.lat, draftGeofence.lng, 15);
};

const handleZoomToCar = () => {
  const v = vehicles[currentDeviceId.value];
  if (v && mapViewerRef.value) {
    draftGeofence.lat = v.lat; draftGeofence.lng = v.lng;
    if (window.innerWidth < 768) mapViewerRef.value.focusCarWithOffset(v.id, 150);
    else mapViewerRef.value.focusCar(v.id);
  }
};

const handleDisableGeofence = async () => { if (!isOwner.value) return; draftGeofence.enabled = false; await saveGeofence(); };
const saveGeofence = async () => {
  if (!isOwner.value) return;
  isSending.value = true;
  try {
    await api.put(`/devices/${currentDeviceId.value}`, { geofence: { ...draftGeofence } });
    if (vehicles[currentDeviceId.value]) vehicles[currentDeviceId.value].geofence = { ...draftGeofence };
    triggerToast("สำเร็จ", draftGeofence.enabled ? "บันทึก Geofence สำเร็จ" : "ปิดแจ้งเตือน Geofence แล้ว", "✅", "success");
    if (draftGeofence.enabled) showGeofencePanel.value = false;
  } catch (e) { triggerToast("ผิดพลาด", "บันทึกผิดพลาด", "❌", "error"); } finally { isSending.value = false; }
};

const handleMapCenterUpdate = (center) => { if (showGeofencePanel.value && isOwner.value) { draftGeofence.lat = center.lat; draftGeofence.lng = center.lng; } };
const handleLogout = () => { localStorage.removeItem("token"); router.push("/login"); };
const handleSelectDevice = (id) => { currentDeviceId.value = id; if (mapViewerRef.value) mapViewerRef.value.focusCar(id); };

// --- Lifecycle ---
onMounted(async () => {
  // Check Admin Role
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      isOwner.value = payload.role === "ADMIN";
    }
  } catch (e) { isOwner.value = false; }

  await fetchInitialData();
  startOfflineCheck();

  // 👂 ฟังแค่พิกัดใหม่ (new_location) เท่านั้น ส่วน new_alert ย้ายไป GlobalAlertManager แล้ว
  socket.on("new_location", (data) => {
    if (vehicles[data.deviceId]) {
      const isIgnOn = ["ON", "on", true, 1, "1"].includes(data.ign);
      let displayStatus = data.ign === "PARKED" ? "PARKED" : (isIgnOn ? "ONLINE" : "OFFLINE");

      Object.assign(vehicles[data.deviceId], {
        lat: Number(data.lat), lng: Number(data.lng), speed: Number(data.speed),
        ign: isIgnOn, status: displayStatus, lastUpdate: new Date(),
        battery: Number(data.battery ?? data.batt ?? vehicles[data.deviceId].battery)
      });
    }
  });
});

onUnmounted(() => {
  // ❌ ห้ามสั่ง socket.disconnect() เพื่อให้ระบบ Global Alert ยังทำงานได้ในหน้าอื่น
  socket.off("new_location"); 
  if (checkInterval) clearInterval(checkInterval);
});
</script>