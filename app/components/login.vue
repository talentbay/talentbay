<template>
  <div class="row">
    <div class="col justify-content-center text-center">
      <div class="btn-group-vertical">
        <button class="btn btn-outline-secondary" :style="btnStyle" @click="loginWithPopup('google')">
          <google-icon />
          Sign in with Google</button>
        <button class="btn btn-outline-secondary" :style="btnStyle" @click="loginWithPopup('github')">
          <git-icon />
          Sign in with GitHub</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { fetch: refreshSession } = useUserSession()
import GoogleIcon from '~/components/icons/google.vue'
import GitIcon from '~/components/icons/github.vue'

const props = defineProps(['color'])
const btnStyle = props.color ? `border-color: ${props.color}; color: ${props.color}` : ''
const imgStyle = props.color ? `fill: ${props.color}` : ''

const loginWithPopup = (provider: string) => {
  const url = `/api/auth/${provider}`
  const name = 'auth'

  // Параметры окна
  const w = 500
  const h = 600
  const left = window.screen.width / 2 - w / 2
  const top = window.screen.height / 2 - h / 2

  // Строка параметров (важно не ставить пробелы после запятых)
  const features = `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,status=no,menubar=no,toolbar=no`

  const popup = window.open(url, name, features)

  // Интервал для отслеживания закрытия окна
  const checkPopup = setInterval(async () => {
    if (!popup || popup.closed) {
      clearInterval(checkPopup)
      // Когда окно закрылось, запрашиваем обновленные данные сессии у сервера
      await refreshSession()
    }
  }, 500)
}
</script>

<style scoped lang="scss">
button {
  img, svg {
    width: 1em;
    height: 1em;
  }
  svg {
    fill: currentColor;
  }
}
</style>