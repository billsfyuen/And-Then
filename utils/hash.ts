import * as bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

//convert password to hashed password
export async function hashPassword(plainPassword: string) {
  const hash: string = await bcrypt.hash(plainPassword, SALT_ROUNDS)
  return hash
}

//check if input password matched hashed password
export async function checkPassword(options: {
  plainPassword: string
  hashedPassword: string
}) {
  const isMatched: boolean = await bcrypt.compare(
    options.plainPassword,
    options.hashedPassword,
  )
  return isMatched
}