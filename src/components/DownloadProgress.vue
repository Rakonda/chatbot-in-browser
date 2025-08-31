<template>
  <div class="flex mt-2 px-1 text-xs text-gray-500 flex-col">
    <span class="text-center">
      Downloading Model {{ received }} / {{ fileSize }} ({{ progress }}%)</span
    >
    <div
      class="bg-blue-500 h-1 rounded-full transition-all duration-150"
      :style="{ width: progress + '%' }"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'
defineProps<{ progress: number; fileSize: string; received: string }>()
</script>

<style scoped>
span {
  margin: 16px 0 21px;
}
</style>
