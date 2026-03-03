<template>
  <footer class="h-6 bg-primary flex items-center justify-between px-3 text-[11px] text-white font-medium select-none shrink-0 z-30">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-1 hover:bg-white/20 px-1 rounded cursor-pointer">
        <span class="material-symbols-outlined text-xs">code</span>
        <span>main*</span>
      </div>
      <div class="flex items-center gap-1 hover:bg-white/20 px-1 rounded cursor-pointer">
        <span class="material-symbols-outlined text-xs">sync</span>
        <span>0</span>
        <span class="material-symbols-outlined text-xs">arrow_upward</span>
        <span>1</span>
        <span class="material-symbols-outlined text-xs">arrow_downward</span>
      </div>
      <div class="flex items-center gap-1 hover:bg-white/20 px-1 rounded cursor-pointer">
        <span class="material-symbols-outlined text-xs">error</span>
        <span>0</span>
        <span class="material-symbols-outlined text-xs">warning</span>
        <span>0</span>
      </div>
    </div>
    
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-1 hover:bg-white/20 px-1 rounded cursor-pointer hidden md:flex">
        <span>Ln 1, Col 1</span>
      </div>
      <div class="flex items-center gap-1 hover:bg-white/20 px-1 rounded cursor-pointer hidden md:flex">
        <span>Spaces: 4</span>
      </div>
      <div class="flex items-center gap-1 hover:bg-white/20 px-1 rounded cursor-pointer">
        <span>UTF-8</span>
      </div>
      <div class="flex items-center gap-1 hover:bg-white/20 px-1 rounded cursor-pointer">
        <span class="material-symbols-outlined text-xs">javascript</span>
        <span>Markdown</span>
      </div>
      <div class="flex items-center gap-1 hover:bg-white/20 px-1 rounded cursor-pointer">
        <span class="material-symbols-outlined text-xs">notifications</span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
</script>
