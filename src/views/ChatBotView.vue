<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import ChatMessage from '../components/ChatMessage.vue'
import workerUrl from '../workers/worker?worker&url'

const worker = new Worker(workerUrl, { type: 'module' })
const thinking = ref<boolean>(false)
const messages = ref<Array<{ sender: string; text: string }>>([])
const input = ref<string>('')
const chatContainer = ref<HTMLDivElement | null>(null)

function handleClick() {
  if (input.value === '') return
  messages.value.push({ sender: 'me', text: input.value })
  worker.postMessage({ type: 'generate', text: input.value })
  input.value = ''
  thinking.value = false
}

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTo({
      top: chatContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

onMounted(() => {
  worker.postMessage({ type: 'init' })

  worker.onmessage = async (event) => {
    switch (event.data.type) {
      case 'ready':
        console.log(event.data.type)
        thinking.value = true
        break
      case 'thinking':
        console.log('thinking')
        break
      case 'download-progress':
        console.log(event.data)
        break
      case 'response':
        messages.value.push({ sender: 'bot', text: event.data.data })
        thinking.value = true
        break
      default:
        break
    }
  }

  watch(
    () => messages.value, // explicitly watch the array value
    async () => {
      await nextTick()
      scrollToBottom()
    },
    { deep: true }, // ensures mutations like push/splice are caught
  )
})

onUnmounted(() => {
  worker.terminate() // Always terminate workers when not needed
})
</script>

<template>
  <!-- Chat messages container -->
  <div class="flex-1 overflow-y-auto chat-messages p-4 space-y-4" ref="chatContainer">
    <template v-for="todo in messages" :key="todo.sender">
      <ChatMessage :message="todo" :time="new Date()" />
    </template>
    <div class="spinner" v-if="!thinking">
      <div class="bounce1"></div>
      <div class="bounce2"></div>
      <div class="bounce3"></div>
    </div>
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
        :disabled="!thinking"
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
