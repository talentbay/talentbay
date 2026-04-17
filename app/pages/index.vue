<template>
  <article>
    <Top></Top>
    <div class="row">
      <div class="col">This is text</div>
      <div class="col">{{ text.data }}</div>
    </div>
  </article>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'
import Top from "~/components/top.vue";

let text = ref(await axios.get('/api/test'))
</script>