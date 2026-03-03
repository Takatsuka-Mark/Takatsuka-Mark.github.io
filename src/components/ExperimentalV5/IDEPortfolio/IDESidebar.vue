<template>
  <aside class="w-64 flex flex-col bg-sidebar-bg border-r border-border-color shrink-0 hidden md:flex">
    <div class="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider flex justify-between items-center group cursor-pointer hover:text-slate-200">
      <span>Explorer</span>
      <span class="material-symbols-outlined text-base opacity-0 group-hover:opacity-100">more_horiz</span>
    </div>
    
    <div class="flex-1 overflow-y-auto">
      <div class="px-0 py-0">
        <div class="flex items-center px-1 py-1 text-slate-300 cursor-pointer hover:bg-slate-800">
          <span class="material-symbols-outlined text-base mr-1 rotate-90">chevron_right</span>
          <span class="text-xs font-bold uppercase tracking-wider">Open Editors</span>
        </div>
        <div class="flex flex-col text-sm pl-0">
          <div class="flex items-center gap-2 px-6 py-1 bg-slate-800/50 text-slate-200 cursor-pointer border-l-2 border-primary">
            <span class="material-symbols-outlined text-base text-slate-400">info</span>
            <span class="truncate">README.md</span>
            <span class="ml-auto text-xs text-slate-500">M</span>
          </div>
        </div>
      </div>
      
      <div class="mt-2">
        <div class="flex items-center px-1 py-1 text-slate-300 cursor-pointer hover:bg-slate-800">
          <span class="material-symbols-outlined text-base mr-1 rotate-90">chevron_right</span>
          <span class="text-xs font-bold uppercase tracking-wider">ALEX-PORTFOLIO</span>
        </div>
        <div class="flex flex-col text-sm font-light text-slate-400">
          <div class="group flex items-center gap-1.5 px-5 py-1 hover:bg-slate-800 hover:text-slate-200 cursor-pointer">
            <span class="material-symbols-outlined text-base text-slate-500">folder</span>
            <span>.github</span>
          </div>
          <div class="group flex items-center gap-1.5 px-5 py-1 hover:bg-slate-800 hover:text-slate-200 cursor-pointer">
            <span class="material-symbols-outlined text-base text-slate-500">folder</span>
            <span>components</span>
          </div>
          <div class="group flex items-center gap-1.5 px-5 py-1 hover:bg-slate-800 hover:text-slate-200 cursor-pointer">
            <span class="material-symbols-outlined text-base text-slate-500">folder</span>
            <span>pages</span>
          </div>
          <div class="group flex items-center gap-1.5 px-5 py-1 hover:bg-slate-800 hover:text-slate-200 cursor-pointer">
            <span class="material-symbols-outlined text-base text-slate-500">folder</span>
            <span>styles</span>
          </div>
          <div class="group flex items-center gap-1.5 px-5 py-1 hover:bg-slate-800 hover:text-slate-200 cursor-pointer">
            <span class="material-symbols-outlined text-base text-yellow-500">javascript</span>
            <span>app.js</span>
          </div>
          <div class="group flex items-center gap-1.5 px-5 py-1 hover:bg-slate-800 hover:text-slate-200 cursor-pointer">
            <span class="material-symbols-outlined text-base text-orange-500">html</span>
            <span>index.html</span>
          </div>
          <div class="group flex items-center gap-1.5 px-5 py-1 hover:bg-slate-800 hover:text-slate-200 cursor-pointer">
            <span class="material-symbols-outlined text-base text-blue-400">css</span>
            <span>main.css</span>
          </div>
          <div class="group flex items-center gap-1.5 px-5 py-1 bg-slate-800 text-slate-200 cursor-pointer">
            <span class="material-symbols-outlined text-base text-slate-400">info</span>
            <span>README.md</span>
          </div>
          <div class="group flex items-center gap-1.5 px-5 py-1 hover:bg-slate-800 hover:text-slate-200 cursor-pointer">
            <span class="material-symbols-outlined text-base text-purple-400">description</span>
            <span>resume.pdf</span>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
</script>
