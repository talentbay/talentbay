<template>
  <footer class="footer">
    <div class="container">
      <div class="row">
        <div class="col-md-4">
          <span class="brand-text">TalentBay</span>
          <p class="footer-desc mt-2">No Borders. Only Opportunities.</p>
        </div>
        <div class="col-md-4">
          <p class="footer-heading">Links</p>
          <ul class="footer-links">
            <li><NuxtLink to="/presentation">Presentation</NuxtLink></li>
            <li><NuxtLink to="/terms">Terms of Service</NuxtLink></li>
            <li><NuxtLink to="/privacy">Privacy Policy</NuxtLink></li>
            <li><a href="#">White Paper</a></li>
            <li><a href="#">Documentation</a></li>
          </ul>
        </div>
        <div class="col-md-4">
          <p class="footer-heading">Contact</p>
          <ul class="footer-links">
            <li><a href="mailto:hello@talentbay.io">hello@talentbay.io</a></li>
            <li><a href="#">@talentbay_io</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom mt-4 pt-4">
        <p class="mb-0">© 2026 TalentBay. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">

</script>

<style scoped lang="scss">
.footer {
  background: #091b2e;
  color: #B0B8C1;
  padding: 60px 70px 30px;

  .brand-text {
    font-family: 'Exo 2', sans-serif;
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--cloud-white);
  }

  .footer-heading {
    font-weight: 600;
    color: var(--cloud-white);
    margin-bottom: 12px;
  }

  .footer-links {
    list-style: none;
    padding: 0;

    li {
      margin-bottom: 8px;

      a {
        color: var(--cool-gray);
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
          color: var(--electric-teal);
        }
      }
    }
  }

  .footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 0.85rem;
  }
}
</style>