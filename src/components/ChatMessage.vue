<script lang="ts" setup>
const props = defineProps<{
  message: {
    sender: string
    text: string
  }
  time: Date
}>()

function formatMessageTime(date: Date): string {
  const now = new Date()
  const isToday: boolean =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const isYesterday: boolean =
    date.getDate() === now.getDate() - 1 &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const time: string = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (isToday) return `Today at ${time}`
  if (isYesterday) return `Yesterday at ${time}`
  return date.toLocaleDateString() + ' at ' + time
}
</script>

<template>
  <!-- Bot message -->
  <div v-if="props.message.sender === 'bot'" class="message flex items-start">
    <div
      class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3"
    >
      <i class="fas fa-robot text-gray-600"></i>
    </div>
    <div class="bg-white p-3 rounded-lg shadow-sm max-w-xs md:max-w-md lg:max-w-lg">
      <p class="text-gray-800" v-html="props.message.text"></p>
      <p class="text-xs text-gray-500 mt-1">{{ formatMessageTime(new Date(props.time)) }}</p>
    </div>
  </div>

  <!-- User message -->
  <div v-else class="message flex items-start justify-end">
    <div class="bg-indigo-100 p-3 rounded-lg shadow-sm max-w-xs md:max-w-md lg:max-w-lg mr-3">
      <p class="text-gray-800" v-html="props.message.text"></p>
      <p class="text-xs text-gray-500 mt-1 text-right">
        {{ formatMessageTime(new Date(props.time)) }}
      </p>
    </div>
    <div
      class="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center"
    >
      <i class="fas fa-user text-white"></i>
    </div>
  </div>
</template>
