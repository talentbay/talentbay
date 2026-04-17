<template>
  <div>
    This is text
    <p>{{ text.data }}</p>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'

let text = ref(await axios.get('/api/test'))
</script>