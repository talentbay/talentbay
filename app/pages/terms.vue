<template>
  <div class="legal-page">
    <section class="legal-content">
      <div class="container">
        <div class="legal-wrapper">
          <p class="overline text-teal">LEGAL</p>
          <h1 class="legal-title">Terms of Service</h1>
          <p class="legal-date">Last updated: April 30, 2026</p>

          <div class="legal-body">
            <h2>1. Introduction</h2>
            <p>Welcome to TalentBay ("Company", "we", "our", "us"). These Terms of Service ("Terms") govern your access to and use of the TalentBay website, platform, and services (collectively, the "Services").</p>
            <p>By accessing or using our Services, you agree to be bound by these Terms. If you do not agree, please do not use our Services.</p>

            <h2>2. Definitions</h2>
            <p><strong>"Platform"</strong> refers to the TalentBay website and all associated services.</p>
            <p><strong>"User"</strong> means any individual or entity that accesses or uses the Platform.</p>
            <p><strong>"Job Seeker"</strong> refers to a User who creates a profile to search for employment opportunities.</p>
            <p><strong>"Employer"</strong> refers to a User who posts job vacancies or searches for candidates.</p>
            <p><strong>"TLB Token"</strong> means the utility token issued by TalentBay for use within the Platform ecosystem.</p>

            <h2>3. Eligibility</h2>
            <p>You must be at least 18 years old to use our Services. By using the Services, you represent and warrant that you meet this requirement.</p>

            <h2>4. Account Registration</h2>
            <p>To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.</p>
            <p>You are responsible for safeguarding your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>

            <h2>5. Platform Services</h2>
            <p>TalentBay provides a platform that connects Job Seekers and Employers globally. Our Services include:</p>
            <ul>
              <li>Job search and matching functionality</li>
              <li>Cost of living and relocation calculators</li>
              <li>AI-powered location recommendations</li>
              <li>Employer and candidate verification tools</li>
              <li>Premium subscription features</li>
            </ul>

            <h2>6. Payment and Tokens</h2>
            <h3>6.1 Payment Independence</h3>
            <p>TalentBay is not a payment intermediary. All payment arrangements between Job Seekers and Employers are negotiated independently by the parties.</p>

            <h3>6.2 TLB Token</h3>
            <p>The TLB token is a utility token designed for use within the TalentBay ecosystem. It can be used to pay for premium services, access exclusive content, and participate in platform governance features.</p>
            <p>TLB tokens do not represent ownership, equity, or any form of investment in TalentBay. They are not securities and should not be purchased with the expectation of profit.</p>

            <h3>6.3 Cryptocurrency Risks</h3>
            <p>You acknowledge that cryptocurrency transactions carry inherent risks, including but not limited to price volatility, technical failures, and regulatory changes. TalentBay is not responsible for any losses incurred through cryptocurrency transactions.</p>

            <h2>7. User Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Platform for any unlawful purpose</li>
              <li>Post false, misleading, or fraudulent information</li>
              <li>Harass, threaten, or discriminate against other Users</li>
              <li>Attempt to gain unauthorized access to the Platform</li>
              <li>Use automated means to scrape or extract data</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>

            <h2>8. Intellectual Property</h2>
            <p>All content, features, and functionality of the Platform, including but not limited to text, graphics, logos, icons, and software, are the exclusive property of TalentBay and are protected by international copyright and trademark laws.</p>

            <h2>9. Privacy</h2>
            <p>Your use of the Platform is also governed by our Privacy Policy. Please review our Privacy Policy to understand how we collect, use, and protect your personal information.</p>

            <h2>10. Disclaimer of Warranties</h2>
            <p>The Platform is provided on an "AS IS" and "AS AVAILABLE" basis. TalentBay makes no warranties, express or implied, regarding the accuracy, reliability, or availability of the Platform.</p>

            <h2>11. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, TalentBay shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.</p>

            <h2>12. Indemnification</h2>
            <p>You agree to indemnify and hold harmless TalentBay and its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Platform or violation of these Terms.</p>

            <h2>13. Modifications to Terms</h2>
            <p>We reserve the right to modify these Terms at any time. We will notify Users of material changes by posting a notice on the Platform or sending an email. Continued use of the Platform after changes constitutes acceptance of the modified Terms.</p>

            <h2>14. Termination</h2>
            <p>We may terminate or suspend your account at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other Users, us, or third parties.</p>

            <h2>15. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where TalentBay is registered, without regard to its conflict of law provisions.</p>

            <h2>16. Contact Information</h2>
            <p>For questions about these Terms, please contact us at:</p>
            <ul>
              <li>Email: <a href="mailto:legal@talentbay.io">legal@talentbay.io</a></li>
              <li>Website: <a href="https://www.talentbay.io">www.talentbay.io</a></li>
            </ul>

            <div class="legal-footer mt-5 pt-4">
              <p class="text-muted">© 2026 TalentBay. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { resolveComponent } from 'vue'
import {getIcon} from '~/components/utils/global.ts'
</script>

<style lang="scss" scoped>
.legal-page {
  background: var(--cloud-white);
  min-height: 100vh;
}

// Content
.legal-content {
  padding: 60px 0 100px;
}

.legal-wrapper {
  max-width: 780px;
  margin: 0 auto;
}

.legal-title {
  font-family: 'Exo 2', sans-serif;
  font-weight: 700;
  font-size: 2.8rem;
  color: var(--deep-navy);
  margin-bottom: 8px;
}

.legal-date {
  color: var(--cool-gray);
  font-size: 0.95rem;
  margin-bottom: 40px;
}

.legal-body {
  h2 {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--deep-navy);
    margin-top: 40px;
    margin-bottom: 16px;
    padding-top: 20px;
    border-top: 1px solid var(--light-gray);

    &:first-child {
      border-top: none;
      margin-top: 0;
      padding-top: 0;
    }
  }

  h3 {
    font-family: 'Exo 2', sans-serif;
    font-weight: 600;
    font-size: 1.15rem;
    color: var(--deep-navy);
    margin-top: 24px;
    margin-bottom: 12px;
  }

  p {
    font-size: 1.05rem;
    color: var(--cool-gray);
    line-height: 1.8;
    margin-bottom: 16px;
  }

  ul {
    margin-bottom: 16px;
    padding-left: 24px;

    li {
      font-size: 1.05rem;
      color: var(--cool-gray);
      line-height: 1.8;
      margin-bottom: 8px;
    }
  }

  a {
    color: var(--electric-teal);
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }

  strong {
    color: var(--deep-navy);
  }
}

.legal-footer {
  border-top: 1px solid var(--light-gray);

  .text-muted {
    color: var(--cool-gray) !important;
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

@media (max-width: 768px) {
  .legal-title {
    font-size: 2rem;
  }

  .legal-content {
    padding: 40px 0 60px;
  }
}
</style>