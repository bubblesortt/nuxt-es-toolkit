<template>
  <div>basic</div>
  <div id="sum">
    {{ sum }}
  </div>
  <div id="chunk">
    {{ chunkText }}
  </div>
  <div id="not-nil">
    {{ String(notNil) }}
  </div>
  <div id="upper">
    {{ upper }}
  </div>
</template>

<script setup>
const sum = etSum([2, 3])
const chunkText = JSON.stringify(etChunk([1, 2, 3, 4], 2))
const notNil = etIsNotNil(null)
const upper = etUpperFirst('hello')
</script>
