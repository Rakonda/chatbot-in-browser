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

onMounted(() => {
  worker.postMessage({ type: 'init' })

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
  <div class="flex-1 overflow-y-auto chat-messages p-4 space-y-4" ref="chatContainer">
    <template v-for="(todo, index) in messages" :key="index">
      <ChatMessage :message="todo" :time="new Date()" />
    </template>
    <ThinkingAnimation :thinking="thinking" />
  </div>
  <div class="border-t border-gray-200 p-4 bg-white">
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
  </div>
</template>
