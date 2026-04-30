<template>
  <nav>
    <ul>
      <li :class="{active: isActive('/ktulhu')}"><a href="/ktulhu">
        <Home />
      </a></li>
      <li :class="{active: isActive('/ktulhu/users')}"><a href="/ktulhu/old/users">
        <Users />
      </a></li>
      <li :class="{active: isActive('/ktulhu/orgs')}"><a href="/ktulhu/orgs">
        <Orgs />
      </a></li>
      <li :class="{active: isActive('/ktulhu/users/test')}"><a href="/ktulhu/orgs">
        <Test />
      </a></li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
  import Users from  '@/components/icons/users.vue'
  import Orgs from  '@/components/icons/orgs.vue'
  import Home from  '@/components/icons/home.vue'
  import Test from  '@/components/icons/test.vue'

  const route = useRoute()

  function isActive (path: string) {
    return path === route.path
  }
</script>

<style scoped lang="scss">
nav {
  margin-top: 8.5rem;
  height: 80%;
  border-right: 1px solid black;
  border-top: 1px solid black;
  border-top-right-radius: .5rem;
  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
    li {
      border-bottom: 1px solid black;
      padding: .25rem;
      text-align: center;
      svg {
        width: 3rem;
        height: 3rem;
      }
      &.active {
        border-color: $app-accent-color;
        svg {
          fill: $app-accent-color
        }
      }
    }
  }
}
</style>