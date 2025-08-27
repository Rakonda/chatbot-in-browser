<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import ChatMessage from '../components/ChatMessage.vue'
import workerUrl from '../workers/worker?worker&url'

const worker = new Worker(workerUrl, { type: 'module' })
const isLoaded = ref<boolean>(false)
const messages = ref<Array<{ sender: string; text: string }>>([])
const input = ref<string>('')

function handleClick() {
  if (input.value === '') return
  messages.value.push({ sender: 'me', text: input.value })
  worker.postMessage({ type: 'generate', text: input.value })
  input.value = ''
}

onMounted(() => {
  worker.postMessage({ type: 'init' })
  worker.onmessage = (event) => {
    console.log(event.data.type)
    if (event.data.type === 'ready') {
      console.log(event.data.type)
      isLoaded.value = true
    }
    if (event.data.type === 'response') {
      messages.value.push({ sender: 'bot', text: event.data.data })
    }
  }
})

onUnmounted(() => {
  worker.terminate() // Always terminate workers when not needed
})
</script>

<template>
  <!-- Chat messages container -->
  <div class="flex-1 overflow-y-auto chat-messages p-4 space-y-4">
    <template v-for="todo in messages" :key="todo.sender">
      <ChatMessage :message="todo" :time="new Date()" />
    </template>
  </div>

  <!-- Input area -->
  <div class="border-t border-gray-200 p-4 bg-white">
    <form id="chatForm" class="flex items-center space-x-2" @submit.prevent="handleClick">
      <div class="flex-1 relative">
        <input
          type="text"
          id="messageInput"
          placeholder="Type your message..."
          class="w-full border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          autocomplete="off"
          v-model="input"
        />
      </div>
      <button
        type="submit"
        class="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <i class="fas fa-paper-plane"></i>
      </button>
    </form>
    <div class="flex justify-end items-center mt-2 px-1 text-xs text-gray-500">
      <span>Press Enter to send</span>
    </div>
  </div>
</template>
