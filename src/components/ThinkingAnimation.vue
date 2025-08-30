<template>
  <div class="spinner" v-if="props.thinking">
    <div class="bounce1"></div>
    <div class="bounce2"></div>
    <div class="bounce3"></div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  thinking: boolean
}>()
</script>
