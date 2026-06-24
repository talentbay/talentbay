<template>
  <div class="landing">
    <!-- Навигация -->
    <!-- Hero -->
    <section class="hero">
      <div class="globe-grid"></div>
      <div class="container position-relative z-1">
        <div class="row align-items-center min-vh-75">
          <div class="col-lg-7">
            <p class="overline text-teal">GLOBAL RECRUITMENT PLATFORM</p>
            <h1 class="hero-title">Work Without<br>Borders</h1>
            <p class="hero-subtitle">Find talent. Relocate. Pay in crypto. All in one platform.</p>
            <div class="d-flex gap-3 flex-wrap mt-4">
              <a href="#" class="btn-teal">Join Pre-ICO</a>
              <NuxtLink to="/presentation" class="btn-outline-teal">View Pitch Deck</NuxtLink>
            </div>
            <div class="hero-stats mt-5">
              <div class="row g-4">
                <div class="col-4">
                  <div class="stat-number">80+</div>
                  <div class="stat-label">Cities covered</div>
                </div>
                <div class="col-4">
                  <div class="stat-number">50+</div>
                  <div class="stat-label">AI parameters</div>
                </div>
                <div class="col-4">
                  <div class="stat-number">$0.04</div>
                  <div class="stat-label">Pre-ICO price</div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-5 d-none d-lg-block">
            <div class="hero-visual">
              <div class="globe-sphere"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="features">
      <div class="container">
        <p class="overline text-teal text-center">FEATURES</p>
        <h2 class="section-title text-center">Everything You Need</h2>
        <div class="row g-4 mt-5">
          <div class="col-md-4" v-for="(feature, idx) in features" :key="idx">
            <div class="feature-card">
              <div class="feature-icon">
                <component :is="getIcon(feature.icon)" />
              </div>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-desc">{{ feature.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="how-it-works">
      <div class="container">
        <p class="overline text-teal text-center">HOW IT WORKS</p>
        <h2 class="section-title text-center">Simple 3-Step Process</h2>
        <div class="steps-horizontal mt-5">
          <div v-for="(step, idx) in steps" :key="idx" class="step-item">
            <div class="step-number">{{ idx + 1 }}</div>
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-desc">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Tokenomics Preview -->
    <section id="tokenomics" class="tokenomics-preview">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-lg-6">
            <p class="overline text-teal">TOKENOMICS</p>
            <h2 class="section-title">TLB Token</h2>
            <p class="body-text">Utility token powering the TalentBay DMCC ecosystem. Pay for premium services, stake for Pro status, and earn rewards.</p>
            <div class="token-highlights mt-4">
              <div class="token-highlight">
                <span class="highlight-label">Pre-ICO Price</span>
                <span class="highlight-value">$0.04</span>
              </div>
              <div class="token-highlight">
                <span class="highlight-label">Public ICO</span>
                <span class="highlight-value">$0.08</span>
              </div>
              <div class="token-highlight">
                <span class="highlight-label">Total Supply</span>
                <span class="highlight-value">500M TLB</span>
              </div>
            </div>
            <a href="#" class="btn-teal mt-4">Join Pre-ICO</a>
          </div>
          <div class="col-lg-6 mt-4 mt-lg-0">
            <div class="token-card-main">
              <div class="token-card-label">PRE-ICO HARDCAP</div>
              <div class="token-card-value">$100,000</div>
              <div class="token-card-note">Limited allocation for early investors</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="container text-center">
        <h2 class="cta-title">Ready to Work Without Borders?</h2>
        <p class="cta-subtitle">Join the future of global recruitment. Early investors get 50% discount.</p>
        <a href="#" class="btn-teal btn-lg">Join Pre-ICO Now</a>
        <div class="mt-4">
          <NuxtLink to="/presentation" class="text-teal">View full presentation →</NuxtLink>
        </div>
      </div>
    </section>

    <FooterNav />
    <GdprConsent />
  </div>
</template>

<script setup>
import FooterNav from '~/components/FooterNav.vue'
import GdprConsent from '~/components/GdprConsent.vue'
import { getIcon } from '~/components/utils/global.ts'

const features = [
  { icon: 'search', title: 'Global Search', desc: 'Find jobs worldwide without geographic restrictions.' },
  { icon: 'map-pin', title: 'Smart Locations', desc: 'AI recommends optimal cities for your lifestyle and budget.' },
  { icon: 'dollar-sign', title: 'Net Income Calculator', desc: 'See real disposable income after taxes and living costs.' },
  { icon: 'credit-card', title: 'Crypto Payments', desc: 'Fast, cheap, borderless compensation in cryptocurrency.' },
  { icon: 'shield', title: 'Verified Employers', desc: 'KYC-verified companies with transparent ratings.' },
  { icon: 'zap', title: 'Instant Relocation Data', desc: 'Visa, housing, transport costs calculated instantly.' }
]

const steps = [
  { title: 'Create Profile', desc: 'Add your skills, desired income, and location preferences.' },
  { title: 'Get Matched', desc: 'AI finds the best jobs and cities for your lifestyle.' },
  { title: 'Start Working', desc: 'Get hired, relocate if needed, and get paid in crypto.' }
]
</script>

<style lang="scss" scoped>
section, footer {
  padding-left: 70px !important;
  padding-right: 70px !important;
}

.landing {
  background: var(--cloud-white);
}

// Hero
.hero {
  background: var(--deep-navy);
  background-image:
      radial-gradient(ellipse at 20% 30%, rgba(0, 212, 170, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 70%, rgba(20, 68, 107, 0.4) 0%, transparent 50%);
  color: var(--cloud-white);
  padding: 100px 0 80px;
  position: relative;
  overflow: hidden;
}

.globe-grid {
  position: absolute;
  top: 0; right: 0;
  width: 60%; height: 100%;
  opacity: 0.06;
  background-image:
      radial-gradient(circle at 70% 50%, #00D4AA 1px, transparent 1px),
      radial-gradient(circle at 60% 40%, #00D4AA 2px, transparent 2px);
  pointer-events: none;
}

.hero-title {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 3.5rem;
  line-height: 1.15;
  margin-bottom: 20px;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: #B0B8C1;
  max-width: 480px;
}

.hero-stats {
  .stat-number {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    font-size: 2rem;
    color: var(--electric-teal);
  }

  .stat-label {
    font-size: 0.85rem;
    color: #B0B8C1;
    margin-top: 4px;
  }
}

.btn-outline-teal {
  border: 2px solid var(--electric-teal);
  color: var(--electric-teal);
  background: transparent;
  padding: 14px 32px;
  border-radius: 50px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s;

  &:hover {
    background: var(--electric-teal);
    color: var(--deep-navy);
  }
}

// Features
.features {
  padding: 80px 0;
}

.feature-card {
  background: var(--cloud-white);
  border: 1px solid var(--light-gray);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  height: 100%;
  transition: all 0.3s;

  &:hover {
    border-color: var(--electric-teal);
    box-shadow: 0 8px 30px rgba(0, 212, 170, 0.1);
    transform: translateY(-4px);
  }
}

.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(0, 212, 170, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: var(--electric-teal);
}

.feature-title {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--deep-navy);
  margin-bottom: 8px;
}

.feature-desc {
  font-size: 0.95rem;
  color: var(--cool-gray);
}

// How It Works
.how-it-works {
  padding: 80px 0;
  background: var(--deep-navy);
  color: var(--cloud-white);

  .section-title {
    color: var(--cloud-white);
  }
}

.steps-horizontal {
  display: flex;
  gap: 32px;
  justify-content: center;
  flex-wrap: wrap;
}

.step-item {
  flex: 1 1 250px;
  max-width: 300px;
  text-align: center;
}

.step-number {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--electric-teal);
  color: var(--deep-navy);
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.step-title {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 1.2rem;
  margin-bottom: 8px;
}

.step-desc {
  font-size: 0.95rem;
  color: #B0B8C1;
}

// Tokenomics Preview
.tokenomics-preview {
  padding: 80px 0;
}

.token-highlights {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.token-highlight {
  background: rgba(0, 212, 170, 0.05);
  border: 1px solid rgba(0, 212, 170, 0.2);
  border-radius: 12px;
  padding: 16px 24px;
  text-align: center;

  .highlight-label {
    display: block;
    font-size: 0.8rem;
    color: var(--cool-gray);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
  }

  .highlight-value {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--electric-teal);
  }
}

.token-card-main {
  background: var(--deep-navy);
  border: 1px solid rgba(0, 212, 170, 0.3);
  border-radius: 20px;
  padding: 48px 32px;
  text-align: center;
  color: var(--cloud-white);
}

.token-card-label {
  font-size: 0.85rem;
  color: var(--cool-gray);
  letter-spacing: 0.15em;
  margin-bottom: 12px;
}

.token-card-value {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 3.5rem;
  color: var(--electric-teal);
  line-height: 1;
}

.token-card-note {
  font-size: 0.95rem;
  color: #B0B8C1;
  margin-top: 12px;
}

// CTA
.cta-section {
  padding: 100px 0;
  background: var(--deep-navy);
  background-image: radial-gradient(ellipse at 50% 50%, rgba(0, 212, 170, 0.1) 0%, transparent 70%);
  color: var(--cloud-white);
}

.cta-title {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.cta-subtitle {
  font-size: 1.1rem;
  color: #B0B8C1;
  margin-bottom: 32px;
}

.text-teal {
  color: var(--electric-teal) !important;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
}

.btn-teal {
  background: linear-gradient(90deg, var(--electric-teal), var(--electric-teal-deep));
  border: none;
  color: var(--deep-navy);
  font-weight: 700;
  padding: 14px 36px;
  border-radius: 50px;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 8px 30px rgba(0, 212, 170, 0.4);
    transform: translateY(-2px);
    color: var(--deep-navy);
  }

  &.btn-lg {
    padding: 18px 48px;
    font-size: 1.1rem;
  }

  &.btn-sm {
    padding: 8px 20px;
    font-size: 0.9rem;
  }
}

// Shared
.overline {
  font-weight: 600;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.text-teal {
  color: var(--electric-teal) !important;
}

.section-title {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 2.4rem;
  margin-bottom: 16px;
  color: var(--deep-navy);
}

.body-text {
  font-size: 1.05rem;
  color: var(--cool-gray);
  line-height: 1.7;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.4rem;
  }

  .section-title {
    font-size: 1.8rem;
  }

  .cta-title {
    font-size: 2rem;
  }

  .token-card-value {
    font-size: 2.5rem;
  }
}
</style>