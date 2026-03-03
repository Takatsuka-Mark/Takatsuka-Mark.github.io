<template>
  <div class="bg-editor-bg text-slate-100 font-mono overflow-hidden h-screen flex flex-col items-center justify-center relative">
    <div 
      class="absolute inset-0 pointer-events-none opacity-[0.03]" 
      style="background-image: linear-gradient(var(--color-border-color) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-color) 1px, transparent 1px); background-size: 40px 40px;"
    ></div>

    <main class="z-10 flex flex-col items-start max-w-2xl w-full px-8 gap-6">
      <div class="flex items-center gap-3 text-lg md:text-xl w-full">
        <div class="flex items-center gap-0 opacity-90 select-none">
          <span class="text-terminal-green font-bold">user@portfolio</span>
          <span class="text-slate-400">:</span>
          <span class="text-terminal-blue font-bold">~</span>
          <span class="text-slate-400">$</span>
        </div>
        <div class="typing-text text-slate-100">whoami</div>
      </div>

      <div class="flex flex-col gap-1 pl-0 mb-4">
        <h1 class="text-5xl md:text-7xl font-bold tracking-tight text-syntax-func">
          Alex Chen
        </h1>
        <p class="text-xl md:text-2xl text-syntax-string font-medium mt-2">
          Computer Scientist
        </p>
      </div>

      <div class="flex items-center gap-3 text-lg md:text-xl w-full">
        <div class="flex items-center gap-0 opacity-90 select-none">
          <span class="text-terminal-green font-bold">user@portfolio</span>
          <span class="text-slate-400">:</span>
          <span class="text-terminal-blue font-bold">~</span>
          <span class="text-slate-400">$</span>
        </div>
        <div class="text-slate-100 flex items-center">
          portfolio.init()
          <span class="ml-1 w-2.5 h-5 bg-slate-400 blink-cursor inline-block"></span>
        </div>
      </div>

      <div class="w-full flex justify-center mt-12">
        <button 
          @click="$emit('launch')"
          class="bg-primary text-white text-xl md:text-2xl font-bold py-4 px-12 rounded-lg shadow-glow hover:shadow-glow-hover hover:scale-105 transition-all duration-300 ease-out border border-blue-500/30"
        >
          Launch
        </button>
      </div>
    </main>

    <div class="fixed bottom-8 text-slate-600 text-xs font-mono">
      Terminal Session: active • v2.4.0
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['launch'])
</script>

<style scoped>
.blink-cursor {
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>
