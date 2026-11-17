<script setup lang="ts">
defineProps<{ saved: boolean; disabled?: boolean; withLabel?: boolean }>()
const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <UTooltip :text="saved ? 'Remove saved vacancy' : 'Save vacancy'">
    <UButton
      :color="saved ? 'primary' : 'neutral'"
      :variant="withLabel ? 'outline' : saved ? 'soft' : 'ghost'"
      :aria-label="saved ? 'Remove saved vacancy' : 'Save vacancy'"
      :aria-pressed="saved"
      :disabled="disabled"
      :class="withLabel ? 'min-h-11 justify-center' : 'size-11 shrink-0 justify-center p-0'"
      @click="emit('click')"
    >
      <UIcon
        name="i-lucide-bookmark"
        mode="svg"
        class="size-5 shrink-0"
        :class="{ '[&_path]:fill-current': saved }"
      />
      <span v-if="withLabel">{{ saved ? 'Saved' : 'Save' }}</span>
    </UButton>
  </UTooltip>
</template>
