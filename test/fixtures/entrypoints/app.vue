<script setup>
const fpMapped = etFpMap(value => value * 2)([1, 2])
const mapFiltered = [...etMapFilter(new Map([['a', 1], ['b', 2]]), value => value > 1)]
const setMapped = [...etSetMap(new Set([1, 2]), value => value * 3)]
</script>

<template>
  <div id="fp">
    {{ JSON.stringify(fpMapped) }}
  </div>
  <div id="map">
    {{ JSON.stringify(mapFiltered) }}
  </div>
  <div id="set">
    {{ JSON.stringify(setMapped) }}
  </div>
</template>
