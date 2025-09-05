<template>
  <div>
    {{ upper }}
  </div>
</template>

<script setup lang="ts">
const upper = useUpperFirst('hello')
</script>
