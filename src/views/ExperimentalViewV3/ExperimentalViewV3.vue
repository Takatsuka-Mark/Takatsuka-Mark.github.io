<template>
  <div class="experimental-v3-container">
    <!-- Header -->
    <header class="v3-header">
      <div class="header-content">Header Content</div>
    </header>

    <div class="v3-body">
      <!-- Sidebar -->
      <aside v-if="!isMobile" class="v3-sidebar" :class="{ collapsed: isSidebarCollapsed }">
        <div class="sidebar-header">
          <button @click="toggleSidebar" class="collapse-btn">
            {{ isSidebarCollapsed ? '>' : '<' }}
          </button>
        </div>
        <div class="sidebar-content">
          <div v-if="isSidebarCollapsed">
            <div class="icon-placeholder">Icon</div>
            <div class="icon-placeholder">Icon</div>
            <div class="icon-placeholder">Icon</div>
          </div>
          <div v-else>
            Navigation Menu
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="v3-main">
        <div class="main-content">
          <h1>Main Body Content</h1>
          <p>This is where the main content goes.</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isSidebarCollapsed = ref(false)
const isMobile = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style lang="scss" scoped>
$bg-color: #333333; /* Dark grey, charcoal padding */
$content-bg: #fdfbf7; /* Extremely light grey with faint sepia hue */
$border-radius: 12px;
$padding: 8px;

.experimental-v3-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: $bg-color;
  padding: $padding;
  box-sizing: border-box;
  gap: $padding;
}

.v3-header {
  height: 60px;
  background-color: $content-bg;
  border-radius: $border-radius;
  display: flex;
  align-items: center;
  padding: 0 20px;
  flex-shrink: 0;

  .header-content {
    font-weight: bold;
    color: #555;
  }
}

.v3-body {
  display: flex;
  flex: 1;
  gap: $padding;
  overflow: hidden; /* Prevent body scroll if content overflows */
}

.v3-sidebar {
  width: 20%;
  background-color: $content-bg;
  border-radius: $border-radius;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;

  &.collapsed {
    width: 60px;
    align-items: center;

    .icon-placeholder {
      width: 40px;
      height: 40px;
      background: #eee;
      border-radius: 50%;
      margin: 10px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
    }
  }

  .sidebar-header {
    padding: 10px;
    display: flex;
    justify-content: flex-end;
  }

  .sidebar-content {
    padding: 20px;
  }

  .collapse-btn {
    background: none;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 16px;
    
    &:hover {
      background: #eee;
    }
  }
}

.v3-main {
  flex: 1;
  background-color: $content-bg;
  border-radius: $border-radius;
  padding: 20px;
  overflow-y: auto;
}
</style>
