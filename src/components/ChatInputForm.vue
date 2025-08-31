<template>
  <form class="flex items-center space-x-2" @submit.prevent="emit('submit')">
    <div class="flex-1 relative">
      <input
        type="text"
        id="messageInput"
        placeholder="Type your message..."
        class="w-full border border-gray-300 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        autocomplete="off"
        :disabled="thinking"
        :value="input"
        @input="onInput"
        ref="qqq"
      />
    </div>
    <button
      :disabled="thinking"
      type="submit"
      class="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 submit"
    >
      <i class="fas fa-paper-plane"></i>
    </button>
  </form>
  <div class="flex justify-end items-center mt-2 px-1 text-xs text-gray-500">
    <span>Press Enter to send</span>
  </div>
</template>

<script lang="ts" setup>
import { defineEmits, defineProps } from 'vue'
defineProps<{ input: string; thinking: boolean }>()
const emit = defineEmits(['update:input', 'submit'])
function onInput(e: Event) {
  const target = e.target as HTMLInputElement | null
  if (target) emit('update:input', target.value)
}
</script>
