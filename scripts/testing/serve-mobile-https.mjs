import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assertCiDatabaseEnvironment } from '../assert-ci-database.mjs'

assertCiDatabaseEnvironment()
// Only this loopback test server uses this ephemeral certificate. No system trust change.
const folder = mkdtempSync(join(tmpdir(), 'talentbay-webkit-tls-'))
try {
  const key = join(folder, 'key.pem'), cert = join(folder, 'cert.pem')
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1', '-keyout', key, '-out', cert], { stdio: 'ignore', timeout: 15000 })
  process.env.NITRO_SSL_CERT = readFileSync(cert, 'utf8')
  process.env.NITRO_SSL_KEY = readFileSync(key, 'utf8')
} finally {
  rmSync(folder, { recursive: true, force: true })
}
delete process.env.NITRO_UNIX_SOCKET
process.env.NITRO_HOST = '127.0.0.1'
process.env.NITRO_PORT = '3138'
await import('../../.output/server/index.mjs')
