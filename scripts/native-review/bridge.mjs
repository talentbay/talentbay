import { execFileSync, spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { closeSync, constants, existsSync, fstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { isDeepStrictEqual, parseEnv } from 'node:util'

const local = 'http://127.0.0.1:4317'
const serverFile = fileURLToPath(new URL('./server.mjs', import.meta.url))
const root = fileURLToPath(new URL('../../', import.meta.url))
const originPattern = /^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.ngrok(?:-free)?\.(?:app|dev)$/
const slugPattern = /^native-review-[a-f0-9]{32}$/
const yaml = 'version: "3"\nagent:\n  web_addr: false\n  log: false\n  console_ui: false\n  remote_management: false\n  update_check: false\n'
class BridgeError extends Error {}
class Starting extends Error {}

function validOrigin(origin) {
  return typeof origin === 'string' && originPattern.test(origin) && origin === new URL(origin).origin
}

export function cliEnvironment(env, projectRoot) {
  const domain = env.TALENTBAY_NATIVE_ORIGIN
  const inputs = {
    TALENTBAY_NATIVE_ORIGIN: validOrigin('https://' + domain) ? 'https://' + domain : domain,
    TALENTBAY_NGROK_AUTHTOKEN: env.TALENTBAY_NGROK_AUTHTOKEN,
    TALENTBAY_TEST_BOT_TOKEN: env.TALENTBAY_TEST_BOT_TOKEN,
    TALENTBAY_TEST_WEBHOOK_SECRET: env.TALENTBAY_TEST_WEBHOOK_SECRET,
  }
  if (inputs.TALENTBAY_TEST_BOT_TOKEN || !validOrigin(inputs.TALENTBAY_NATIVE_ORIGIN)
    || !inputs.TALENTBAY_NGROK_AUTHTOKEN || /\s/.test(inputs.TALENTBAY_NGROK_AUTHTOKEN)) return inputs

  let fd
  try {
    fd = openSync(join(projectRoot, '.env.preview-review.local'), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
    const stat = fstatSync(fd)
    if (!stat.isFile() || stat.uid !== process.getuid() || stat.nlink !== 1 || (stat.mode & 0o022) || stat.size > 128 * 1024)
      throw new Error()
    const token = parseEnv(readFileSync(fd, 'utf8')).NUXT_TELEGRAM_BOT_TOKEN
    if (typeof token !== 'string' || !/^[1-9]\d{0,15}:[A-Za-z0-9_-]{20,128}$/.test(token))
      throw new Error()
    inputs.TALENTBAY_TEST_BOT_TOKEN = token
  } catch (error) {
    if (error.code !== 'ENOENT') throw new BridgeError('Could not use the project preview tester token; supply TALENTBAY_TEST_BOT_TOKEN.')
  } finally { if (fd !== undefined) closeSync(fd) }
  return inputs
}

function settings(env) {
  const origin = env.TALENTBAY_NATIVE_ORIGIN
  if (!validOrigin(origin))
    throw new BridgeError('Set TALENTBAY_NATIVE_ORIGIN to an exact dedicated HTTPS ngrok origin.')
  const token = env.TALENTBAY_TEST_BOT_TOKEN
  const authtoken = env.TALENTBAY_NGROK_AUTHTOKEN
  if (!token || !authtoken || /\s/.test(token + authtoken))
    throw new BridgeError('Supply the dedicated test bot token and ngrok authtoken.')
  const webhookSecret = env.TALENTBAY_TEST_WEBHOOK_SECRET ?? randomBytes(32).toString('hex')
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(webhookSecret))
    throw new BridgeError('Invalid test webhook secret.')
  return { origin, token, authtoken, webhookSecret }
}

function privateEnv(home) {
  mkdirSync(home, { mode: 0o700 })
  return {
    HOME: home, TMPDIR: home, XDG_CONFIG_HOME: home, XDG_CACHE_HOME: home,
    PATH: [dirname(process.execPath), '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin'].join(':'),
    LANG: 'C', LC_ALL: 'C',
  }
}

function installedNgrok(env) {
  const path = ['/opt/homebrew/bin/ngrok', '/usr/local/bin/ngrok', '/usr/bin/ngrok'].find(existsSync)
  if (path) {
    const file = realpathSync(path)
    try {
      const version = execFileSync(file, ['version'], {
        env, cwd: env.HOME, encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'],
      })
      if (/^ngrok version 3\.\d+\.\d+\b/.test(version)) return file
    } catch { /* Do not print subprocess output. */ }
  }
  throw new BridgeError('An installed ngrok v3 CLI is required.')
}

// Direct GET only: no browser cookies, proxy discovery, redirect handler or incoming headers.
function readJson(url, signal) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http
    const req = client.get(url, {
      agent: false, rejectUnauthorized: true,
      signal: AbortSignal.any([signal, AbortSignal.timeout(4000)]),
      headers: { 'accept': 'application/json', 'ngrok-skip-browser-warning': '1', 'cache-control': 'no-cache' },
    }, (res) => {
      const invalid = () => { reject(new BridgeError('Unexpected response from native review endpoint.')); res.destroy() }
      res.on('error', () => reject(new Starting()))
      if ([404, 502, 503, 504].includes(res.statusCode)) { reject(new Starting()); res.destroy(); return }
      if (res.statusCode !== 200 || !/^application\/json(?:\s*;|$)/i.test(res.headers['content-type'] ?? '')) { invalid(); return }
      const chunks = []
      let size = 0
      res.on('data', (chunk) => {
        size += chunk.length
        if (size > 128 * 1024) invalid()
        else chunks.push(chunk)
      })
      res.once('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) } catch { invalid() }
      })
    })
    req.on('error', () => reject(new Starting()))
  })
}

async function verifyEdge(origin, path, vacancy, signal, get) {
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(30_000)])
  while (!deadline.aborted) {
    try {
      const health = await get(origin + '/api/health', deadline)
      if (health?.service !== 'talentbay' || health.status !== 'ok' || health.runtime !== 'node')
        throw new BridgeError('Public health does not identify the local TalentBay runtime.')
      const publicVacancy = await get(origin + path, deadline)
      if (!isDeepStrictEqual(publicVacancy, vacancy))
        throw new BridgeError('Public vacancy does not match this native review run.')
      return
    } catch (error) {
      if (!(error instanceof Starting)) throw error
      await delay(350, undefined, { signal: deadline })
    }
  }
  throw new BridgeError('Public native review endpoint was not ready in time.')
}

function track(child, name, faults) {
  const fail = () => faults.abort(new BridgeError(`Owned ${name} stopped unexpectedly.`))
  child.once('error', fail)
  child.once('exit', fail)
  const closed = new Promise(resolve => child.once('close', resolve))
  let stopping
  async function terminate() {
    if (child.pid && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM')
      // Allow the server to reap its private application/database before forcing it down.
      const timer = setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
      }, 15_000)
      try { await closed } finally { clearTimeout(timer) }
    } else { await closed }
  }
  return () => stopping ??= terminate()
}

export async function runBridge({
  env = process.env, signal: stop, bot, spawnChild = spawn, verifyCli = installedNgrok, get = readJson,
  announce = console.log,
}) {
  const { origin, token, authtoken, webhookSecret } = settings(env)
  const faults = new AbortController()
  const signal = AbortSignal.any([stop, faults.signal])
  signal.throwIfAborted()
  const temp = realpathSync('/tmp')
  const dir = mkdtempSync(join(temp, 'talentbay-native-'))
  let stopServer, stopTunnel, failure, bindingAttempted = false, stage = 'local server startup'
  const closeEdge = () => { void stopTunnel?.() }
  try {
    const agentEnv = privateEnv(join(dir, 'agent'))
    const config = join(agentEnv.HOME, 'ngrok.yml')
    writeFileSync(config, yaml, { mode: 0o600, flag: 'wx' })
    const cli = verifyCli(agentEnv)
    const server = spawnChild(process.execPath, [serverFile], {
      cwd: root, stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      env: {
        // The server owns its disposable cluster and its removal, independently of our config.
        ...privateEnv(join(dir, 'server')), TMPDIR: temp, TALENTBAY_TEST_BOT_TOKEN: token,
        TALENTBAY_TEST_WEBHOOK_SECRET: webhookSecret, TALENTBAY_NATIVE_ORIGIN: origin,
      },
    })
    stopServer = track(server, 'server', faults)
    server.once('disconnect', () => faults.abort(new BridgeError('Lost native review server IPC.')))
    const [ready] = await once(server, 'message', { signal: AbortSignal.any([signal, AbortSignal.timeout(300_000)]) })
    if (ready?.type !== 'ready' || typeof ready.slug !== 'string' || !slugPattern.test(ready.slug))
      throw new BridgeError('Invalid native review server readiness message.')
    const path = '/api/v1/vacancies/' + ready.slug
    const vacancy = await get(local + path, signal)
    if (vacancy?.slug !== ready.slug || !Number.isSafeInteger(vacancy.id) || vacancy.id < 1
      || !vacancy.title || !vacancy.company?.name || vacancy.source?.status !== 'VERIFIED'
      || !/^v1:[a-f0-9]{64}$/.test(vacancy.applicationContext))
      throw new BridgeError('Local synthetic vacancy was not ready.')
    signal.throwIfAborted()
    stage = 'ngrok HTTPS verification'
    const tunnel = spawnChild(cli, ['http', local, '--url=' + origin, '--inspect=false', '--config=' + config], {
      cwd: agentEnv.HOME, env: { ...agentEnv, NGROK_AUTHTOKEN: authtoken }, stdio: 'ignore',
    })
    stopTunnel = track(tunnel, 'ngrok', faults)
    signal.addEventListener('abort', closeEdge, { once: true })
    await verifyEdge(origin, path, vacancy, signal, get)
    signal.throwIfAborted()
    // A rejected configure can still have changed a binding. Serialize detach after it settles.
    bindingAttempted = true
    stage = 'Telegram test bot binding'
    await bot.configureNativeBot({ token, origin, webhookSecret })
    signal.throwIfAborted()
    announce('Native review ready: ' + origin)
    if (!signal.aborted) await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }))
    signal.throwIfAborted()
  } catch (error) {
    if (!stop.aborted) failure = faults.signal.reason ?? (error instanceof BridgeError ? error : new BridgeError('Native review failed during ' + stage + '.'))
  } finally {
    signal.removeEventListener('abort', closeEdge)
    try {
      // Hold the local port during detach so a replacement run cannot bind in the middle.
      const [edge, detach] = await Promise.allSettled([
        stopTunnel?.(), bindingAttempted && Promise.resolve().then(() => bot.detachNativeBot({ token, origin })),
      ])
      if (detach.status === 'rejected') failure = new BridgeError('Could not confirm removal of the test bot binding.')
      else if (edge.status === 'rejected') failure = new BridgeError('Could not stop the native review tunnel.')
    } finally {
      try { await stopServer?.() } finally { rmSync(dir, { recursive: true, force: true }) }
    }
  }
  if (failure) throw failure
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const stop = new AbortController()
  const shutdown = () => stop.abort()
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  process.on('SIGHUP', shutdown)
  try {
    if (process.argv.length !== 2) throw new BridgeError('Native review takes no command-line arguments.')
    const { configureNativeBot, detachNativeBot } = await import('./bot.mjs')
    await runBridge({ env: cliEnvironment(process.env, root), signal: stop.signal, bot: { configureNativeBot, detachNativeBot } })
  } catch (error) {
    console.error(error instanceof BridgeError ? error.message : 'Native review bridge failed.')
    process.exitCode = 1
  } finally {
    process.off('SIGINT', shutdown)
    process.off('SIGTERM', shutdown)
    process.off('SIGHUP', shutdown)
  }
}
