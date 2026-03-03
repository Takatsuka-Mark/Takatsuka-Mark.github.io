<template>
  <main class="flex-1 flex flex-col bg-editor-bg relative min-w-0">
    <div class="flex bg-activity-bar-bg border-b border-border-color overflow-x-auto no-scrollbar">
      <div class="flex items-center gap-2 px-3 py-2 bg-editor-bg border-t-2 border-primary min-w-fit cursor-pointer text-slate-200 text-sm">
        <span class="material-symbols-outlined text-sm text-slate-400">info</span>
        <span>README.md</span>
        <span class="material-symbols-outlined text-sm hover:bg-slate-700 rounded p-0.5 ml-2">close</span>
      </div>
      <div class="group flex items-center gap-2 px-3 py-2 border-r border-border-color min-w-fit cursor-pointer text-slate-500 hover:bg-sidebar-bg hover:text-slate-300 text-sm border-t-2 border-transparent">
        <span class="material-symbols-outlined text-sm text-yellow-500">javascript</span>
        <span>app.js</span>
        <span class="material-symbols-outlined text-sm hover:bg-slate-700 rounded p-0.5 ml-2 opacity-0 group-hover:opacity-100">close</span>
      </div>
      <div class="flex items-center gap-2 px-3 py-2 border-r border-border-color min-w-fit cursor-pointer text-slate-500 hover:bg-sidebar-bg hover:text-slate-300 text-sm border-t-2 border-transparent">
        <span class="material-symbols-outlined text-sm text-orange-500">html</span>
        <span>index.html</span>
      </div>
    </div>
    
    <div class="flex items-center gap-1 px-4 py-1 text-xs text-slate-500 bg-editor-bg border-b border-border-color/50">
      <span>alex-portfolio</span>
      <span class="material-symbols-outlined text-sm">chevron_right</span>
      <span>README.md</span>
    </div>
    
    <div class="flex-1 overflow-y-auto relative">
      <div class="flex min-h-full">
        <!-- Line numbers -->
        <div class="w-12 flex flex-col items-end pr-4 py-4 text-slate-600 font-mono text-sm select-none bg-editor-bg shrink-0">
          <div v-for="n in 25" :key="n">{{ n }}</div>
        </div>
        
        <div class="flex-1 px-4 py-4 max-w-4xl">
          <div class="markdown-content font-sans">
            <h1 class="flex items-center gap-3">
              <span class="text-primary font-mono text-4xl">Hi, I'm Alex Chen</span>
              <span class="material-symbols-outlined text-3xl text-yellow-400 animate-pulse">waving_hand</span>
            </h1>
            
            <p class="text-xl text-slate-300 mt-4">
              Creative Developer & UI/UX Designer specialized in building exceptional digital experiences.
            </p>
            
            <div class="flex flex-wrap gap-2 my-6">
              <span class="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-mono">React</span>
              <span class="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-xs font-mono">JavaScript</span>
              <span class="px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded text-xs font-mono">Tailwind</span>
              <span class="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs font-mono">Node.js</span>
              <span class="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs font-mono">Figma</span>
            </div>
            
            <h2>🚀 About Me</h2>
            <p>
              I'm a passionate developer with a knack for turning complex problems into simple, beautiful, and intuitive designs. Currently building the future of web applications.
            </p>
            
            <ul class="list-none pl-0 space-y-2 mt-4 font-mono text-sm text-slate-400">
              <li class="flex items-center gap-2">
                <span class="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                <span>Based in San Francisco, CA</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-400 text-sm">work</span>
                <span>Senior Frontend Engineer at TechCorp</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="material-symbols-outlined text-purple-400 text-sm">school</span>
                <span>MS Computer Science, Stanford</span>
              </li>
            </ul>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div class="bg-sidebar-bg border border-border-color rounded-lg p-4 hover:border-slate-500 transition-colors cursor-pointer group">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-blue-400 font-mono text-sm">latest-project</span>
                  <span class="material-symbols-outlined text-slate-500 group-hover:text-white transition-colors">arrow_outward</span>
                </div>
                <h3 class="text-slate-200 font-medium mb-1">E-Commerce Dashboard</h3>
                <p class="text-slate-400 text-sm">A full-stack analytics dashboard for online retailers featuring real-time data visualization.</p>
              </div>
              
              <div class="bg-sidebar-bg border border-border-color rounded-lg p-4 hover:border-slate-500 transition-colors cursor-pointer group">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-green-400 font-mono text-sm">open-source</span>
                  <span class="material-symbols-outlined text-slate-500 group-hover:text-white transition-colors">arrow_outward</span>
                </div>
                <h3 class="text-slate-200 font-medium mb-1">React-Grid-System</h3>
                <p class="text-slate-400 text-sm">Lightweight responsive grid component library downloaded 10k+ times on NPM.</p>
              </div>
            </div>
            
            <h2>📫 Connect</h2>
            <p>
              Feel free to reach out for collaborations or just a friendly hello.
            </p>
            
            <div class="flex gap-4 mt-4 font-mono text-sm">
              <a class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors" href="#">
                <span class="material-symbols-outlined text-base">mail</span>
                hello@alexchen.dev
              </a>
              <a class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors" href="#">
                <span class="material-symbols-outlined text-base">link</span>
                github.com/alex
              </a>
              <a class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors" href="#">
                <span class="material-symbols-outlined text-base">group</span>
                linkedin.com/in/alex
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div class="absolute right-0 top-0 bottom-0 w-3 bg-transparent hover:bg-white/5 z-10 hidden md:block">
        <div class="w-full bg-slate-600/30 h-16 mt-12 rounded-full"></div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
</script>

<style scoped>
.markdown-content h1 { font-size: 2.25rem; font-weight: 700; margin-bottom: 1rem; color: #e6edf3; }
.markdown-content h2 { font-size: 1.5rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #e6edf3; border-bottom: 1px solid #30363d; padding-bottom: 0.5rem; }
.markdown-content p { margin-bottom: 1rem; line-height: 1.6; color: #c9d1d9; }
.markdown-content a { color: #58a6ff; text-decoration: none; }
.markdown-content a:hover { text-decoration: underline; }
.markdown-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; color: #c9d1d9; }
.markdown-content li { margin-bottom: 0.25rem; }
.markdown-content code { background-color: rgba(110, 118, 129, 0.4); padding: 0.2em 0.4em; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 85%; }
.markdown-content pre { background-color: #161b22; padding: 1rem; border-radius: 6px; overflow-x: auto; margin-bottom: 1rem; }
.markdown-content pre code { background-color: transparent; padding: 0; }
</style>
