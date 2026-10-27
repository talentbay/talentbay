import { parseBotEntryConfig, prepareBotEntry } from '../../server/services/bot/entry-contract'

if (process.argv.length !== 2) throw new Error('Offline bot preview accepts no credentials or arguments')
const config = parseBotEntryConfig({
  botID: '999999', username: 'talentbay_local_review_bot', token: 'local-preview-no-api-token',
  secret: 'local_preview_not_a_secret'.repeat(2), appOrigin: 'https://talentbay.example',
})
if (!config) throw new Error('Invalid synthetic bot preview configuration')
const allowed = new Set(['/jobs', '/applications', '/privacy'])
const preview = ['/start', '/jobs', '/applications', '/help', '/privacy'].map((command, index) => {
  const entry = prepareBotEntry({ update_id: index, message: { message_id: index+1, chat: { id: 1, type: 'private' }, from: { id: 1, is_bot: false }, text: command } }, config)
  if (!entry?.reply) throw new Error('Cannot prepare synthetic bot command')
  return {
    command, text: entry.reply.text,
    links: entry.reply.reply_markup.inline_keyboard.flat().map((button) => {
      const url = new URL(button.web_app?.url || button.url || '')
      if (url.origin !== config.appOrigin || !allowed.has(url.pathname) || url.search || url.hash) throw new Error('Unexpected synthetic bot destination')
      return { label: button.text, path: url.pathname }
    }),
  }
})
// Pure contract preview only: no database, webhook receipt, Telegram call or delivery.
console.log(JSON.stringify(preview))
