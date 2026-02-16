import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Task {
  id: string
  command: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  createdAt: Date
}

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])

  const addTask = (command: string) => {
    const task: Task = {
      id: crypto.randomUUID(),
      command: command.trim(),
      status: 'pending',
      createdAt: new Date()
    }
    tasks.value.push(task)
    return task
  }

  const clearTasks = () => {
    tasks.value = []
  }

  return {
    tasks,
    addTask,
    clearTasks
  }
})
