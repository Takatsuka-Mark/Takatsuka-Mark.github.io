<template>
  <div class="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display overflow-hidden h-screen flex flex-col">
    <IDEHeader />
    <div class="flex flex-1 overflow-hidden">
      <IDEActivityBar />
      <IDESidebar />
      <IDEEditor />
    </div>
    <IDEFooter />
  </div>
</template>

<script setup lang="ts">
import IDEHeader from './IDEHeader.vue'
import IDEActivityBar from './IDEActivityBar.vue'
import IDESidebar from './IDESidebar.vue'
import IDEEditor from './IDEEditor.vue'
import IDEFooter from './IDEFooter.vue'
</script>
