<template>
  <div class="legal-page">
    <!-- Контент -->
    <section class="legal-content">
      <div class="container">
        <div class="legal-wrapper">
          <p class="overline text-teal">LEGAL</p>
          <h1 class="legal-title">Privacy Policy</h1>
          <p class="legal-date">Last updated: April 30, 2026</p>

          <div class="legal-body">
            <h2>1. Introduction</h2>
            <p>TalentBay ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.</p>
            <p>Please read this policy carefully. By using the TalentBay platform, you consent to the practices described in this policy.</p>

            <h2>2. Information We Collect</h2>

            <h3>2.1 Personal Information</h3>
            <p>We may collect the following personal information when you register or use our Services:</p>
            <ul>
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Professional experience and skills</li>
              <li>Location preferences</li>
              <li>Cryptocurrency wallet addresses (optional)</li>
              <li>Profile picture (optional)</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <p>When you access our Platform, we automatically collect:</p>
            <ul>
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Pages visited and time spent</li>
              <li>Referring URL</li>
            </ul>

            <h3>2.3 Cookies and Similar Technologies</h3>
            <p>We use cookies and similar tracking technologies to improve your experience. You can control cookies through your browser settings.</p>

            <h2>3. How We Use Your Information</h2>
            <p>We use the collected information for the following purposes:</p>
            <ul>
              <li>To provide and maintain our Services</li>
              <li>To match Job Seekers with relevant employment opportunities</li>
              <li>To verify user identities (KYC for Employers)</li>
              <li>To improve and personalize user experience</li>
              <li>To communicate with you about updates, security alerts, and support</li>
              <li>To comply with legal obligations</li>
              <li>To prevent fraud and abuse</li>
            </ul>

            <h2>4. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal information. We may share your information in the following circumstances:</p>

            <h3>4.1 With Employers</h3>
            <p>When you apply for a job or express interest, your profile information (excluding sensitive data) may be shared with the prospective Employer.</p>

            <h3>4.2 Service Providers</h3>
            <p>We may share data with third-party vendors who assist us in operating the Platform (hosting, analytics, KYC verification). These providers are contractually obligated to protect your data.</p>

            <h3>4.3 Legal Requirements</h3>
            <p>We may disclose information if required by law, court order, or government regulation.</p>

            <h3>4.4 Business Transfers</h3>
            <p>In the event of a merger, acquisition, or sale of assets, user data may be transferred as part of the transaction.</p>

            <h2>5. Data Security</h2>
            <p>We implement industry-standard security measures to protect your data:</p>
            <ul>
              <li>Encryption of data in transit (TLS/SSL)</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication</li>
              <li>Employee training on data protection</li>
            </ul>
            <p>However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.</p>

            <h2>6. Data Retention</h2>
            <p>We retain your personal information for as long as your account is active or as needed to provide you Services. You may request deletion of your data at any time by contacting us.</p>
            <p>Certain information may be retained for legal, accounting, or fraud prevention purposes.</p>

            <h2>7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your data ("Right to be forgotten")</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing of your data</li>
              <li><strong>Withdraw Consent:</strong> Withdraw previously given consent</li>
            </ul>
            <p>To exercise these rights, please contact us at <a href="mailto:privacy@talentbay.io">privacy@talentbay.io</a>.</p>

            <h2>8. International Data Transfers</h2>
            <p>TalentBay operates globally. Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.</p>

            <h2>9. Children's Privacy</h2>
            <p>Our Services are not directed to individuals under 18 years of age. We do not knowingly collect information from children. If we become aware that a minor has provided us with personal data, we will delete it.</p>

            <h2>10. Third-Party Links</h2>
            <p>Our Platform may contain links to third-party websites. We are not responsible for the privacy practices of those websites. We encourage you to review their privacy policies.</p>

            <h2>11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Last updated" date.</p>

            <h2>12. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
            <ul>
              <li>Email: <a href="mailto:privacy@talentbay.io">privacy@talentbay.io</a></li>
              <li>Data Protection Officer: <a href="mailto:dpo@talentbay.io">dpo@talentbay.io</a></li>
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

</script>

<style lang="scss" scoped>
.legal-page {
  background: var(--cloud-white);
  min-height: 100vh;
}

.back-link {
  color: var(--cool-gray);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: var(--electric-teal);
  }
}

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

    &:first-of-type {
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