import axios from "axios"
axios.defaults.baseURL = process.env.WP_API_URL

export default async function _loginUserWP (username: string, password: string) {
  try {
    const { data }: { data: LoginUserWP } = await axios.post(
      "/wp-json/moserver/token",
      {
        grant_type: "password",
        username,
        password,
        client_id: process.env.MOSERVER_API_CLIENT_KEY,
        client_secret: process.env.MOSERVER_API_CLIENT_SECRET,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
    console.log({data})
    // @ts-ignore
    if(data.error)return null
    return data
  } catch (e) {
    console.log({e})
    return null
  }
}

export interface LoginUserWP {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  refresh_token: string
}
