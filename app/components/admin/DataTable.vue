<template>
  <div class="table-wrap">
    <table class="data-table">
      <thead>
      <tr>
        <th v-for="col in columns" :key="col">{{ col }}</th>
        <th v-if="$slots.actions">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(row, idx) in rows" :key="idx">
        <td v-for="(cell, cIdx) in row" :key="cIdx">{{ cell }}</td>
        <td v-if="$slots.actions">
          <slot name="actions" :row="row" :index="idx" />
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: Array,
  rows: Array
})
</script>

<style lang="scss" scoped>
.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.9rem;
    white-space: nowrap;
  }

  th {
    font-weight: 600;
    color: var(--cool-gray);
    border-bottom: 2px solid var(--light-gray);
  }

  td {
    color: var(--deep-navy);
    border-bottom: 1px solid #f1f5f9;
  }

  tbody tr:hover {
    background: #f8fafc;
  }
}
</style>