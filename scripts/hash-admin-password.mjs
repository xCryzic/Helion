import { randomBytes, scryptSync } from 'node:crypto'

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
  console.error('Run this command in an interactive terminal.')
  process.exit(1)
}

process.stdout.write('Admin password: ')
process.stdin.setRawMode(true)
process.stdin.resume()
process.stdin.setEncoding('utf8')

let password = ''
process.stdin.on('data', (key) => {
  if (key === '\u0003') process.exit(130)
  if (key === '\r' || key === '\n') {
    process.stdin.setRawMode(false)
    process.stdin.pause()
    process.stdout.write('\n')
    if (password.length < 12) {
      console.error('Use at least 12 characters.')
      process.exit(1)
    }
    const salt = randomBytes(16)
    const hash = scryptSync(password, salt, 64)
    password = ''
    console.log(`ADMIN_PASSWORD_HASH=scrypt$${salt.toString('hex')}$${hash.toString('hex')}`)
    return
  }
  if (key === '\u007f' || key === '\b') {
    password = password.slice(0, -1)
    return
  }
  if (/^[\x20-\x7E]$/.test(key)) password += key
})
