import axios from "axios"

interface IProps {
  body?: any
  method?: "GET" | "POST" | "PUT" | "DELETE"
  url: string
  token?: string
}
export default async function ApiFetcher<T = any> ({
  method="GET",
  body,
  url,
  token
}: IProps) {
  const { data }: { data: T } = await axios(url, {
    headers: {
      Authorization: token ? `Basic ${token}` : undefined,
    },
    method,
    data: body,
  })
  return data
}
