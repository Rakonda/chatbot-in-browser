<script lang="ts" setup>
import ThinkingAnimation from '@/components/ThinkingAnimation.vue'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import ChatInputForm from '@/components/ChatInputForm.vue'
import ChatMessage from '@/components/ChatMessage.vue'
import DownloadProgress from '@/components/DownloadProgress.vue'

const worker = new Worker(new URL('@/workers/worker.js', import.meta.url), {
  type: 'module',
})
const thinking = ref<boolean>(false)
const messages = ref<Array<{ sender: string; text: string }>>([])
const input = ref<string>('')
const chatContainer = ref<HTMLDivElement | null>(null)
const downloadInProgress = ref<boolean>(true)
const startLoading = ref<boolean>(false)
const isDownloading = ref({
  progress: 0,
  fileSize: '',
  received: '',
})

function handleClick() {
  if (input.value === '') return
  messages.value.push({ sender: 'me', text: input.value })
  worker.postMessage({ type: 'generate', text: input.value })
  input.value = ''
}

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTo({
      top: chatContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

function load() {
  worker.postMessage({ type: 'init' })
  startLoading.value = true
}

onMounted(() => {

  worker.onmessage = async (event) => {
    switch (event.data.type) {
      case 'ready':
        thinking.value = false
        downloadInProgress.value = false
        break
      case 'thinking':
        console.log('thinking')
        thinking.value = true
        break
      case 'download-progress':
        isDownloading.value = {
          progress: event.data.progress,
          fileSize: event.data.fileSize,
          received: event.data.received,
        }
        break
      case 'response':
        thinking.value = false
        messages.value.push({ sender: 'bot', text: event.data.data })
        break
      case 'error':
        console.error('Worker error:', event.data.message)
        messages.value.push({ sender: 'bot', text: '⚠️ ' + event.data.message })
        downloadInProgress.value = false
        thinking.value = false
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

  worker.onerror = (err) => {
    console.error('Worker crashed:', err.message)
    messages.value.push({ sender: 'bot', text: '💥 Worker crashed: ' + err.message })
    downloadInProgress.value = false
    thinking.value = false
    worker.terminate()
  }
})

onUnmounted(() => {
  worker.terminate() // Always terminate workers when not needed
})
</script>

<template>
  <div
    class="flex-1 overflow-y-auto chat-messages p-4 space-y-4"
    ref="chatContainer"
  >
    <template
      v-for="(todo, index) in messages"
      :key="index"
    >
      <ChatMessage
        :message="todo"
        :time="new Date()"
      />
    </template>
    <ThinkingAnimation :thinking="thinking" />
  </div>
  <div class="border-t border-gray-200 p-4 bg-white">
    <div
      class="flex justify-center flex-col"
      v-if="!startLoading"
    >
      <button
        @click="load"
        type="button"
        class="px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >Start
        chatting with the bot</button>
    </div>
    <template v-else>
      <ChatInputForm
        v-if="!downloadInProgress"
        v-model:input="input"
        :thinking="thinking"
        @submit="handleClick"
      />
      <DownloadProgress
        v-else
        :progress="isDownloading.progress"
        :fileSize="isDownloading.fileSize"
        :received="isDownloading.received"
      />
    </template>
  </div>
</template>
