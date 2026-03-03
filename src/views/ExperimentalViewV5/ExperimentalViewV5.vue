<template>
  <div class="experimental-v5-container dark">
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    
    <Transition name="fade-slide" mode="out-in">
      <TerminalLaunch 
        v-if="!isLaunched" 
        @launch="launchIDE" 
      />
      <IDEPortfolio v-else />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import TerminalLaunch from '../../components/ExperimentalV5/TerminalLaunch.vue'
import IDEPortfolio from '../../components/ExperimentalV5/IDEPortfolio/IDEPortfolio.vue'
import '../../styles/tailwind.css'

const isLaunched = ref(false)

const launchIDE = () => {
  isLaunched.value = true
}

onMounted(() => {
  // Add dark class to html for Tailwind dark mode
  document.documentElement.classList.add('dark')
})

onUnmounted(() => {
  // Remove dark class when leaving page to avoid affecting other pages
  document.documentElement.classList.remove('dark')
})
</script>

<style scoped>
.experimental-v5-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* Transition animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: scale(0.98) translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: scale(1.02) translateY(-10px);
}
</style>
