<template>
  <aside 
    class="bg-sidebar-bg border-border-color shrink-0 hidden md:flex overflow-hidden transition-all duration-300 ease-in-out"
    :class="isSidebarOpen ? 'w-64 border-r opacity-100' : 'w-0 border-r-0 opacity-0'"
  >
    <div class="w-64 flex flex-col h-full shrink-0">
    <div class="px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider flex justify-between items-center group cursor-pointer hover:text-slate-200">
      <span>Explorer</span>
      <span class="material-symbols-outlined text-base opacity-0 group-hover:opacity-100">more_horiz</span>
    </div>
    
    <div class="flex-1 overflow-y-auto">
      <div class="px-0 py-0">
        <div class="flex items-center px-1 py-1 text-slate-300 cursor-pointer hover:bg-slate-800 select-none" @click="isOpenEditorsOpen = !isOpenEditorsOpen">
          <span class="material-symbols-outlined text-base mr-1 transition-transform duration-200" :class="isOpenEditorsOpen ? 'rotate-90' : ''">chevron_right</span>
          <span class="text-xs font-bold uppercase tracking-wider">Open Editors</span>
        </div>
        <div v-show="isOpenEditorsOpen" class="flex flex-col text-sm pl-0">
          <div 
            v-for="file in openFiles" 
            :key="'open-'+file.id"
            @click="openFile({ id: file.id, name: file.name, icon: file.icon, iconColorClass: file.iconColorClass })"
            class="flex items-center gap-2 px-6 py-1 cursor-pointer border-l-2"
            :class="activeFileId === file.id ? 'bg-slate-800/50 text-slate-200 border-primary' : 'text-slate-400 border-transparent hover:bg-slate-800 focus:bg-slate-800'"
          >
            <span class="material-symbols-outlined text-base" :class="file.iconColorClass || 'text-slate-400'">{{ file.icon }}</span>
            <span class="truncate">{{ file.name }}</span>
            <span class="ml-auto text-xs text-slate-500 hover:bg-slate-700 rounded p-0.5 opacity-0 hover:opacity-100 transition-opacity" @click.stop="closeFile(file.id)">close</span>
          </div>
        </div>
      </div>
      
      <div class="mt-2">
        <div class="flex items-center px-1 py-1 text-slate-300 cursor-pointer hover:bg-slate-800">
          <span class="material-symbols-outlined text-base mr-1 rotate-90">chevron_right</span>
          <span class="text-xs font-bold uppercase tracking-wider">PORTFOLIO</span>
        </div>
        <div class="flex flex-col text-sm font-light text-slate-400">
          
          <div 
            class="group flex items-center gap-1.5 px-5 py-1 cursor-pointer"
            :class="activeFileId === 'README.md' ? 'bg-slate-800 text-slate-200' : 'hover:bg-slate-800 hover:text-slate-200'"
            @click="openFile({ id: 'README.md', name: 'README.md', icon: 'info', iconColorClass: 'text-slate-400' })"
          >
            <span class="material-symbols-outlined text-base text-slate-400">info</span>
            <span>README.md</span>
          </div>

          <div 
            class="group flex items-center gap-1.5 px-3 py-1 hover:bg-slate-800 hover:text-slate-200 cursor-pointer select-none"
            @click="isProjectsOpen = !isProjectsOpen"
          >
            <span class="material-symbols-outlined text-base transition-transform duration-200 pt-0.5" :class="isProjectsOpen ? 'rotate-90' : ''">chevron_right</span>
            <span class="material-symbols-outlined text-base text-slate-500">folder</span>
            <span class="ml-0.5">projects</span>
          </div>

          <div v-show="isProjectsOpen" class="flex flex-col">
            <div 
              class="group flex items-center gap-1.5 pl-10 pr-5 py-1 cursor-pointer"
              :class="activeFileId === 'project-alpha.md' ? 'bg-slate-800 text-slate-200' : 'hover:bg-slate-800 hover:text-slate-200'"
              @click="openFile({ id: 'project-alpha.md', name: 'project-alpha.md', icon: 'info', iconColorClass: 'text-slate-400' })"
            >
              <span class="material-symbols-outlined text-base text-slate-400">info</span>
              <span>project-alpha.md</span>
            </div>
            <div 
              class="group flex items-center gap-1.5 pl-10 pr-5 py-1 cursor-pointer"
              :class="activeFileId === 'project-beta.md' ? 'bg-slate-800 text-slate-200' : 'hover:bg-slate-800 hover:text-slate-200'"
              @click="openFile({ id: 'project-beta.md', name: 'project-beta.md', icon: 'info', iconColorClass: 'text-slate-400' })"
            >
              <span class="material-symbols-outlined text-base text-slate-400">info</span>
              <span>project-beta.md</span>
            </div>
          </div>

          <div 
            class="group flex items-center gap-1.5 px-5 py-1 cursor-pointer"
            :class="activeFileId === 'resume.pdf' ? 'bg-slate-800 text-slate-200' : 'hover:bg-slate-800 hover:text-slate-200'"
            @click="openFile({ id: 'resume.pdf', name: 'resume.pdf', icon: 'description', iconColorClass: 'text-purple-400' })"
          >
            <span class="material-symbols-outlined text-base text-purple-400">description</span>
            <span>resume.pdf</span>
          </div>

        </div>
      </div>
    </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useIDEState } from '../../../composables/useIDEState'

const isProjectsOpen = ref(false)
const isOpenEditorsOpen = ref(false)
const { openFiles, activeFileId, openFile, closeFile, isSidebarOpen } = useIDEState()

</script>
