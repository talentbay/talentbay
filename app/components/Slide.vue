<template>
  <section ref="slideRef" class="slide"
           :class="[`slide--${type}`, { 'slide--dark': isDark, 'slide--hero': isHero }]"
           v-intersect
  >
    <div v-if="isHero" class="globe-grid" />
    <div class="position-relative z-1 my-auto" :class="{ 'text-center': isHero }">
      <p v-if="overline" class="overline">{{ overline }}</p>
      <h2 v-if="title" class="section-title" v-html="title" />
      <p v-if="subtitle" class="body-text subtitle" v-html="subtitle" />

      <template v-if="blocks">
        <div v-for="(block, index) in blocks" :key="index" :class="block.wrapperClass">
          <!-- Текстовые блоки -->
          <p v-if="block.text" class="body-text" v-html="block.text" />

          <!-- Карточки с иконками -->
          <div v-if="block.cards" class="cards-grid">
            <div v-for="(card, cIdx) in block.cards" :key="cIdx" class="cards-grid__item" :class="card.colClass">
              <div class="card-feature" :class="{ 'card-dark': isDark }">
                <div class="icon-circle">
                  <component :is="getIcon(card.icon)" />
                </div>
                <h5 class="section-subtitle">{{ card.heading }}</h5>
                <p class="body-text-sm">{{ card.description }}</p>
              </div>
            </div>
          </div>

          <!-- Список с иконками -->
          <ul v-if="block.iconList" class="icon-list mt-4">
            <li v-for="(item, lIdx) in block.iconList" :key="lIdx">
              <component :is="getIcon(item.icon)" />
              <span v-html="item.text" />
            </li>
          </ul>

          <!-- Шаги (for job seekers) -->
          <div v-if="block.steps" class="row align-items-start text-center my-5">
            <template v-for="(step, sIdx) in block.steps" :key="sIdx">
              <div :class="step.colClass || 'col-md-2'">
                <div class="icon-circle mx-auto">
                  <component :is="getIcon(step.icon)" />
                </div>
                <p class="fw-bold mt-2 mb-1">{{ step.label }}</p>
                <p class="body-text-sm">{{ step.description }}</p>
              </div>
              <div v-if="sIdx < block.steps.length - 1" class="col-md-1 step-arrow d-none d-md-flex">
                <ArrowRightIcon />
              </div>
            </template>
          </div>

          <!-- Таблица (бизнес-модель) -->
          <div v-if="block.table" class="table-responsive">
            <table class="table table-borderless" :style="isDark ? 'color:#B0B8C1' : ''">
              <tbody>
              <tr v-for="(row, rIdx) in block.table" :key="rIdx">
                <td style="color:var(--electric-teal); font-size:1.5rem;">
                  <component :is="getIcon(row.icon)" />
                </td>
                <td><strong :class="isDark ? 'text-white' : ''">{{ row.heading }}</strong></td>
                <td :style="isDark ? 'color:#B0B8C1' : ''">{{ row.description }}</td>
              </tr>
              </tbody>
            </table>
          </div>

          <!-- Bar chart (Use of funds / Token distribution) -->
          <div v-if="block.bars" class="mt-4">
            <div v-for="(bar, bIdx) in block.bars" :key="bIdx" class="fund-bar-wrap">
              <div class="fund-bar-label">
                <span>{{ bar.label }}</span><span>{{ bar.value }}%</span>
              </div>
              <div class="fund-bar">
                <div class="fund-bar-fill" :style="{ width: bar.value + '%' }">{{ bar.value }}%</div>
              </div>
            </div>
            <p v-if="block.footnote" class="body-text-sm mt-2"><em>{{ block.footnote }}</em></p>
          </div>

          <!-- Timeline -->
          <div v-if="block.timeline" class="timeline mt-5">
            <div v-for="(item, tIdx) in block.timeline" :key="tIdx" class="timeline-item">
              <div class="timeline-date">{{ item.date }}</div>
              <div class="timeline-dot" :class="{ 'timeline-dot--current': item.current }" />
              <div class="timeline-text">{{ item.text }}</div>
            </div>
          </div>

          <!-- Badge -->
          <div v-if="block.badge" class="text-center mt-4">
            <span class="badge-teal">{{ block.badge }}</span>
          </div>

          <!-- Token cards -->
          <div v-if="block.tokenCards" class="row g-3">
            <div v-for="(tc, tcIdx) in block.tokenCards" :key="tcIdx" class="col-6">
              <div class="token-card">
                <p class="token-label">{{ tc.label }}</p>
                <p class="token-value">{{ tc.value }}</p>
                <p v-if="tc.note" class="body-text-sm mb-0" style="color:#B0B8C1;">{{ tc.note }}</p>
              </div>
            </div>
          </div>

          <div v-if="block.team" class="row g-3">
            <div v-for="member in block.team.members" :key="member.initials" class="col-md-4">
              <div class="card-team">
                <div class="avatar">{{ member.initials }}</div>
                <h6 class="fw-bold mb-1">{{ member.name }}</h6>
                <span class="badge-teal d-inline-block mb-2">{{ member.role }}</span>
                <p class="body-text-sm mb-0">{{ member.bio }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- CTA Button -->
      <div v-if="cta" class="text-center mt-4">
        <a :href="cta.link" class="btn-teal">{{ cta.text }}</a>
      </div>
    </div>
    <div v-if="footer" class="slide-footer">{{ footer }}</div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import {getIcon} from '~/components/utils/global.ts'

const slideRef = ref(null) // ссылка на DOM-элемент слайда

const props = defineProps({
  type: { type: String, default: 'light' },
  overline: String,
  title: String,
  subtitle: String,
  blocks: Array,
  cta: Object,
  footer: String
})

const isDark = computed(() => props.type === 'dark')
const isHero = computed(() => props.type === 'hero')
</script>

<style lang="scss" scoped>
.slide {
  background: var(--cloud-white);
  border-radius: 24px;
  padding: 60px 70px;
  margin-bottom: 30px;
  box-shadow: 0 20px 60px rgba(10, 37, 64, 0.15);
  min-height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 24px 70px rgba(10, 37, 64, 0.2);
  }

  &--dark {
    background: var(--deep-navy);
    background-image:
        radial-gradient(ellipse at 30% 20%, rgba(20, 68, 107, 0.6) 0%, transparent 60%),
        radial-gradient(circle at 70% 80%, rgba(0, 212, 170, 0.08) 0%, transparent 50%);
    color: var(--cloud-white);
    .section-title { color: var(--cloud-white); }
    .section-subtitle { color: var(--cool-gray); }
    .body-text { color: #B0B8C1; }
  }

  &--hero {
    background: var(--deep-navy);
    background-image:
        radial-gradient(ellipse at 20% 30%, rgba(0, 212, 170, 0.12) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 70%, rgba(20, 68, 107, 0.5) 0%, transparent 50%),
        url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q10 45 20 50 T40 50 T60 50 T80 50 T100 50 M50 0 Q45 10 50 20 T50 40 T50 60 T50 80 T50 100' stroke='%2300D4AA' stroke-width='0.3' fill='none' opacity='0.15'/%3E%3C/svg%3E");
    color: var(--cloud-white);

    .section-title { color: var(--cloud-white);
    }
  }
}

.globe-grid {
  position: absolute;
  top: 0; right: 0;
  width: 60%; height: 100%;
  opacity: 0.08;
  background-image:
      radial-gradient(circle at 70% 50%, #00D4AA 1px, transparent 1px),
      radial-gradient(circle at 60% 40%, #00D4AA 2px, transparent 2px),
      radial-gradient(circle at 80% 60%, #00D4AA 1.5px, transparent 1.5px);
  pointer-events: none;
}

.overline {
  font-weight: 500;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--cool-gray);
  margin-bottom: 12px;
}

.section-title {
  font-weight: 700;
  font-size: 2.4rem;
  line-height: 1.2;
  margin-bottom: 40px;
  letter-spacing: -0.02em;
  color: var(--deep-navy);

  :deep(br) { display: block; }
}

.body-text {
  font-family: var(--font-heading);
  font-size: 1.05rem;
  color: var(--cool-gray);
  line-height: 1.7;
}

.body-text-sm {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  color: var(--cool-gray);
  line-height: 1.6;
}

.section-subtitle {
  font-weight: 600;
  font-size: 1.2rem;
  color: var(--deep-navy);
  margin-bottom: 8px;
}

.card-feature, .card-dark {
  border-radius: 16px;
  padding: 28px 24px;
  text-align: center;
  height: 100%;
  transition: all 0.3s ease;
}

.card-feature {
  background: var(--cloud-white);
  border: 1px solid var(--light-gray);
  &:hover {
    border-color: var(--electric-teal);
    box-shadow: 0 8px 30px rgba(0, 212, 170, 0.1);
  }
}

.card-dark {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 1.5rem;
  color: var(--electric-teal);
  background: rgba(0, 212, 170, 0.1);
  .card-dark & { background: rgba(0, 212, 170, 0.15); }
}

.icon-list {
  list-style: none;
  padding: 0;
  li {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 18px;
    font-family: var(--font-heading);
    font-size: 1rem;
    color: var(--cool-gray);
    line-height: 1.5;
    svg {
      color: var(--electric-teal);
      flex-shrink: 0;
      margin-top: 2px;
    }
  }
}

.step-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--electric-teal);
  font-size: 1.5rem;
}

.timeline {
  display: flex;
  gap: 0;
  align-items: flex-start;
  position: relative;
  margin-top: 30px;

  &::before {
    content: '';
    position: absolute;
    top: 42px; // высота даты (~20px) + margin-bottom (12px) + половина точки (10px) = 42px
    left: 20px;
    right: 20px;
    height: 3px;
    background: var(--electric-teal);
    z-index: 0;
    border-radius: 2px;
  }
}

.timeline-item {
  flex: 1;
  text-align: center;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-date {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--electric-teal);
  margin-bottom: 12px;
  line-height: 1.3;
}

.timeline-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--electric-teal);
  border: 4px solid var(--cloud-white);
  box-shadow: 0 0 0 3px var(--electric-teal);
  z-index: 2;
  flex-shrink: 0;

  .slide--dark & {
    border-color: var(--deep-navy);
  }

  &--current {
    background: var(--cloud-white);

    .slide--dark & {
      background: var(--cloud-white);
    }
  }
}

.timeline-text {
  font-size: 0.8rem;
  color: var(--cool-gray);
  margin-top: 12px;

  .slide--dark & {
    color: #B0B8C1;
  }
}

@media (max-width: 768px) {
  .timeline {
    flex-direction: column;
    gap: 24px;
    margin-top: 0;

    &::before {
      display: none;
    }
  }
}

.slide-footer {
  position: absolute;
  bottom: 30px;
  right: 50px;
  font-size: 0.75rem;
  color: var(--cool-gray);
}

.fund-bar-wrap { margin-bottom: 20px; }

.fund-bar-label {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 6px;
}

.fund-bar {
  height: 36px;
  border-radius: 8px;
  background: var(--light-gray);
  overflow: hidden;
}

.fund-bar-fill {
  height: 100%;
  border-radius: 8px;
  background: linear-gradient(90deg, #00D4AA 0%, #00B894 100%);
  display: flex;
  align-items: center;
  padding-left: 14px;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--deep-navy);
}

.token-card {
  background: var(--deep-navy);
  border: 1px solid rgba(0, 212, 170, 0.3);
  border-radius: 16px;
  padding: 32px 28px;
  text-align: center;
  color: var(--cloud-white);
}

.token-label {
  font-size: 0.85rem;
  color: var(--cool-gray);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.token-value {
  font-weight: 700;
  font-size: 2rem;
  color: var(--electric-teal);
}

.badge-teal {
  background: rgba(0, 212, 170, 0.15);
  color: var(--electric-teal);
  font-weight: 600;
  font-size: 0.8rem;
  padding: 6px 14px;
  border-radius: 50px;
}

.highlight-teal {
  color: var(--electric-teal);
  font-weight: 600;
}

// Team cards
.card-team {
  background: var(--cloud-white);
  border: 1px solid var(--light-gray);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  height: 100%;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--cool-gray);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  }
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--electric-teal), var(--electric-teal-deep));
  color: var(--deep-navy);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.4rem;
  margin: 0 auto 12px;
}

.btn-teal {
  background: linear-gradient(90deg, #00D4AA 0%, #00B894 100%);
  border: none;
  color: var(--deep-navy);
  font-weight: 700;
  font-size: 1.1rem;
  padding: 16px 40px;
  border-radius: 50px;
  letter-spacing: 0.02em;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  &:hover {
    background: var(--electric-teal);
    box-shadow: 0 8px 30px rgba(0, 212, 170, 0.4);
    transform: translateY(-2px);
  }
}

@media (max-width: 768px) {
  .slide {
    padding: 30px 24px;
    border-radius: 16px;
    margin-bottom: 16px;
    min-height: auto;
  }
  .section-title { font-size: 1.8rem; margin-bottom: 24px; }
  .timeline {
    flex-direction: column;
    gap: 24px;
    padding-top: 0;

    &::before {
      display: none;
    }
  }

  .timeline-item {
    padding-top: 0;
  }

  .timeline-dot {
    margin: 0 auto 12px;
  }
}
.feather-icon, .icon-circle svg, .icon-list svg, .card-feature svg, .card-dark svg {
  width: 1.3rem;
  height: 1.3rem;
  color: var(--electric-teal);
  flex-shrink: 0;
}

.cards-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px; // отступы со всех сторон
  margin-top: 16px;

  &__item {
    flex: 1 1 280px; // минимальная ширина карточки, чтобы переносились на узких экранах
    max-width: calc(33.333% - 16px); // три в ряд с учётом gap

    @media (max-width: 768px) {
      max-width: 100%;
      flex: 1 1 100%;
    }
  }
}

.steps-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: center;
  gap: 16px;
  margin: 40px 0;

  &__item {
    flex: 1 1 150px;
    max-width: 200px;
    text-align: center;
  }
}

.step-arrow {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20px; // выравнивание стрелки по верхнему краю иконок
  color: var(--electric-teal);
}

.icon-list {
  list-style: none;
  padding: 0;
  margin-top: 24px;

  li {
    display: flex;
    align-items: center; // ← вертикальное центрирование
    gap: 16px;
    margin-bottom: 16px;
    font-family: var(--font-heading);
    font-size: 1rem;
    color: var(--cool-gray);
    line-height: 1.6;

    svg {
      width: 1.1rem;
      height: 1.1rem;
      color: var(--electric-teal);
      flex-shrink: 0;
      align-self: center; // ← принудительное центрирование
    }

    span {
      display: flex;
      align-items: center;
      flex-wrap: wrap;

      strong {
        margin-right: 6px;
        font-family: var(--font-heading);
        color: var(--deep-navy);
        font-weight: 600;
      }
    }
  }
}

.icon-list-lg {
  li {
    svg {
      width: 1.5rem;
      height: 1.5rem;
    }
  }
}

.slide--dark,
.slide--hero {
  .icon-list li {
    align-items: center;

    svg {
      align-self: center;
    }

    span {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }
  }
  .table {
    background: transparent;
    color: #B0B8C1;

    td {
      background: transparent !important;
      border: none;
      vertical-align: middle;
      padding: 12px 8px;
    }
  }
}
</style>
