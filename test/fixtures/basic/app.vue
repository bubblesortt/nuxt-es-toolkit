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
const sum = useAdd(2, 3)
const chunkText = JSON.stringify(useChunk([1, 2, 3, 4], 2))
const notNil = isNotNil(null)
const upper = useUpperFirst('hello')
</script>
