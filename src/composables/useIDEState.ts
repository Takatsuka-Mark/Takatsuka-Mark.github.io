import { ref, reactive } from 'vue'

export interface IDEFile {
    id: string;
    name: string;
    icon: string;
    iconColorClass?: string;
    content?: string;
}

// Global state for IDE
const openFiles = ref<IDEFile[]>([
    {
        id: 'README.md',
        name: 'README.md',
        icon: 'info',
        iconColorClass: 'text-slate-400'
    }
])

const activeFileId = ref<string>('README.md')
const fileHistory = ref<string[]>(['README.md'])
const isSidebarOpen = ref<boolean>(true)

export function useIDEState() {
    
    const openFile = (file: IDEFile) => {
        const existingIndex = openFiles.value.findIndex(f => f.id === file.id)
        if (existingIndex === -1) {
            openFiles.value.push(file)
        }
        activeFileId.value = file.id
        
        // Update history
        fileHistory.value = fileHistory.value.filter(id => id !== file.id)
        fileHistory.value.push(file.id)
    }

    const closeFile = (fileId: string) => {
        const index = openFiles.value.findIndex(f => f.id === fileId)
        if (index > -1) {
            openFiles.value.splice(index, 1)
            
            // Remove from history
            fileHistory.value = fileHistory.value.filter(id => id !== fileId)
            
            // Set new active file if the closed one was active
            if (activeFileId.value === fileId) {
                if (fileHistory.value.length > 0) {
                    activeFileId.value = fileHistory.value[fileHistory.value.length - 1] || ''
                } else {
                    activeFileId.value = ''
                }
            }
        }
    }
    
    const reorderFiles = (fromIndex: number, toIndex: number) => {
      if (fromIndex >= 0 && fromIndex < openFiles.value.length && toIndex >= 0 && toIndex <= openFiles.value.length) {
          const movedItem = openFiles.value.splice(fromIndex, 1)[0]
          if (movedItem) {
              openFiles.value.splice(toIndex, 0, movedItem)
          }
      }
    }

    return {
        isSidebarOpen,
        openFiles,
        activeFileId,
        openFile,
        closeFile,
        reorderFiles
    }
}
