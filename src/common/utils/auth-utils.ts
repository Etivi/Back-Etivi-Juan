import { compare, genSalt, hash } from "bcrypt"
export const hashPassword = async (password: string) => {
  const salts = await genSalt(10)
  return await hash(password, salts)
}

export const comparePassword = async (hashed: string, normal: string) => {
  return await compare(normal, hashed)
}
