<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <!-- Header -->
  <header class="bg-indigo-600 text-white p-4 shadow-md">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
          <i class="fas fa-robot text-xl"></i>
        </div>
        <h1 class="text-xl font-bold">AI Assistant</h1>
      </div>
      <button class="p-2 rounded-full hover:bg-indigo-500 transition">
        <i class="fas fa-ellipsis-v"></i>
      </button>
    </div>
  </header>
  <RouterView />
</template>
