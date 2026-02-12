import { createRouter, createWebHistory } from 'vue-router';

// 1. Import Views ทั้งหมด
import LoginView from './views/LoginView.vue'; 
import RegisterView from './views/RegisterView.vue';
import DashboardView from './views/DashboardView.vue';
import HistoryView from './views/HistoryView.vue';
import JoinView from './views/JoinView.vue';        // สำหรับรับรถจากเพื่อน
import VerifyEmail from './views/VerifyEmail.vue';  // สำหรับยืนยันอีเมล
import PublicTracking from './views/PublicTracking.vue'; // ✅ เพิ่มหน้านี้ 
import ChangePasswordView from './views/ChangePassword.vue'; // 👈 เพิ่มบรรทัดนี้
import ForgotPasswordView from './views/ForgotPasswordView.vue';
import ResetPasswordView from './views/ResetPasswordView.vue';
const routes = [
  // ==========================================
  // 🔓 Public Routes (ไม่ต้อง Login)
  // ==========================================
  { 
    path: '/login', 
    name: 'Login', 
    component: LoginView,
    meta: { requiresAuth: false }
  },
  { 
    path: '/register', 
    name: 'Register', 
    component: RegisterView,
    meta: { requiresAuth: false }
  },
  {
    path: '/forgot-password', // ✅ เพิ่ม Route นี้
    name: 'forgot-password',
    component: ForgotPasswordView,
    meta: { requiresAuth: false }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPasswordView,
    meta: { requiresAuth: false } // 🔓 สำคัญ: ต้องเป็น false เพราะคนลืมรหัสยังไม่ได้ Login
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: VerifyEmail,
    meta: { requiresAuth: false } 
  },
  {
    path: '/join/:token',
    name: 'Join',
    component: JoinView,
    meta: { requiresAuth: false } 
  },
  // ✅ Route นี้คือหัวใจสำคัญ! (ลิงก์ในอีเมลแจ้งเตือนภัย)
  {
    path: '/track-public/:token', 
    name: 'PublicTracking',
    component: PublicTracking,
    meta: { 
      requiresAuth: false, // 🔓 เปิดให้ตำรวจ/คนนอกดูได้เลย
      layout: 'empty'      // (เผื่อมี layout)
    }
  },

  // ==========================================
  // 🔒 Private Routes (ต้อง Login)
  // ==========================================
  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    component: DashboardView,
    meta: { requiresAuth: true } 
  },
  {
    path: '/history/:deviceId',
    name: 'History',
    component: HistoryView,
    meta: { requiresAuth: true }
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: ChangePasswordView,
    meta: { requiresAuth: true }
  },

  // ==========================================
  // 🔄 Redirects & Catch All
  // ==========================================
  {
    path: '/',
    redirect: '/dashboard'
  },
  // กันลิงก์มั่ว (Catch All) -> ดีดไป Login
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 🔥 Logic การตรวจบัตรผ่านทาง (Router Guard)
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('token');

  // 1. ถ้าหน้านั้นต้องการ Login (requiresAuth: true) แต่เราไม่มี Token -> ดีดไป Login
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login');
  } 
  // 2. ถ้าเข้าหน้า Login/Register แต่มี Token อยู่แล้ว -> ดีดไป Dashboard
  // (ยกเว้น VerifyEmail, Join, PublicTracking ให้ปล่อยผ่านได้เลย)
  else if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    next('/dashboard');
  } 
  // 3. กรณีอื่นๆ -> ปล่อยผ่าน
  else {
    next();
  }
});

export default router;