<template>
  <header class="flex items-center justify-between whitespace-nowrap border-b border-border-color bg-sidebar-bg px-4 py-2 shrink-0 select-none z-30">
    <div class="flex items-center gap-3">
      <div class="size-6 text-primary flex items-center justify-center">
        <span class="material-symbols-outlined text-xl">terminal</span>
      </div>
      <div class="flex items-center text-xs text-slate-400 ml-2">
        <div class="px-3 py-1 hover:bg-slate-700/50 rounded cursor-pointer">File</div>
        <div class="px-3 py-1 hover:bg-slate-700/50 rounded cursor-pointer">Edit</div>
        <div class="px-3 py-1 hover:bg-slate-700/50 rounded cursor-pointer">Selection</div>
        <div class="px-3 py-1 hover:bg-slate-700/50 rounded cursor-pointer">View</div>
        <div class="px-3 py-1 hover:bg-slate-700/50 rounded cursor-pointer">Go</div>
        <div class="px-3 py-1 hover:bg-slate-700/50 rounded cursor-pointer">Run</div>
        <div class="px-3 py-1 hover:bg-slate-700/50 rounded cursor-pointer">Terminal</div>
        <div class="px-3 py-1 hover:bg-slate-700/50 rounded cursor-pointer">Help</div>
      </div>
    </div>
    
    <div class="flex items-center gap-4">
      <div class="text-xs text-slate-500 font-mono hidden md:block">alex-chen-portfolio [SSH: remote]</div>
      <div class="flex gap-2 ml-4">
        <div class="size-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 cursor-pointer"></div>
        <div class="size-3 rounded-full bg-green-500/80 hover:bg-green-500 cursor-pointer"></div>
        <div class="size-3 rounded-full bg-red-500/80 hover:bg-red-500 cursor-pointer"></div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
</script>
