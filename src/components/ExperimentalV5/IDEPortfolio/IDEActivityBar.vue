<template>
  <aside class="w-12 flex flex-col items-center py-4 bg-activity-bar-bg border-r border-border-color shrink-0 z-20">
    <div class="flex flex-col gap-4 w-full">
      <!-- Sidebar Toggle -->
      <button @click="isSidebarOpen = !isSidebarOpen" class="text-slate-500 hover:text-slate-300 w-full flex justify-center transition-colors relative group py-2 mb-2" title="Toggle Sidebar">
        <span class="material-symbols-outlined text-[24px] rotate-180">view_sidebar</span>
      </button>

      <button class="text-slate-100 border-l-2 border-primary w-full flex justify-center relative group py-2">
        <span class="material-symbols-outlined text-[24px] opacity-100">folder_open</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useIDEState } from '../../../composables/useIDEState'
const { isSidebarOpen } = useIDEState()
</script>
