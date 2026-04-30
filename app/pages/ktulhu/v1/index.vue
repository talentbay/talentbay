<template>
  <div class="dashboard">
    <h1 class="page-title">Dashboard</h1>

    <div class="stats-grid">
      <StatCard icon="users" label="Total Users" value="12,847" change="+12.5%" trend="up" />
      <StatCard icon="building" label="Organizations" value="1,284" change="+8.2%" trend="up" />
      <StatCard icon="briefcase" label="Active Jobs" value="4,921" change="+24.3%" trend="up" />
      <StatCard icon="coins" label="TLB Transacted" value="3.2M" change="-3.1%" trend="down" />
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <h3>User Registrations</h3>
        <div class="chart-placeholder">Chart area</div>
      </div>
      <div class="chart-card">
        <h3>Token Transactions</h3>
        <div class="chart-placeholder">Chart area</div>
      </div>
    </div>

    <div class="recent-activity">
      <h3>Recent Activity</h3>
      <DataTable :columns="['User', 'Action', 'Date']" :rows="recentRows" />
    </div>
  </div>
</template>

<script setup>
import StatCard from '@/components/admin/StatCard.vue'
import DataTable from '@/components/admin/DataTable.vue'

definePageMeta({ layout: 'admin' })

const recentRows = [
  ['John Doe', 'Registered as Job Seeker', '2 min ago'],
  ['TechCorp Ltd', 'Posted new job', '15 min ago'],
  ['Maria S.', 'Completed KYC', '1 hour ago'],
  ['CryptoPay Inc', 'Verified employer badge', '2 hours ago'],
]
</script>

<style lang="scss" scoped>
.page-title {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 1.8rem;
  color: var(--deep-navy);
  margin-bottom: 28px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--light-gray);

  h3 {
    font-family: 'Exo 2', sans-serif;
    font-weight: 600;
    color: var(--deep-navy);
    margin-bottom: 16px;
  }

  .chart-placeholder {
    height: 200px;
    background: #f8fafc;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cool-gray);
  }
}

.recent-activity {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--light-gray);

  h3 {
    font-family: 'Exo 2', sans-serif;
    font-weight: 600;
    color: var(--deep-navy);
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>