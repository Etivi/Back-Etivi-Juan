import axios from "axios"
import { UserMembershipSchema } from "../../memberships/types/user-membership.type"
import { z } from "nestjs-zod/z"
import { GraphqlService } from "src/common/graphql/graphql.service"
axios.defaults.baseURL = process.env.WP_API_URL

export default async function _getUserData(id: string) {
  try {
    const data = await queryGraphqlUserById(id)
    console.log({ data })
    if (!data) return null
    const { user_pass, ...user } = data

    return user
  } catch (e) {

    return null
  }
}

export async function _getUserID(email: string) {
  try {
    const data = await queryGraphqlUserIDByEmail(email)
    console.log({ data })
    if (data) return data
  } catch (e) {
    console.log({ e })
  }
  return null
}


async function queryGraphqlUserIDByEmail(email: string) {
  const userByEmailGQL = `
    query Query($search: String!) {
      users(where: {search: $search, searchColumns: EMAIL}) {
        nodes {
          databaseId
        }
      }
    }
  `
  const res = await GraphqlService.queryGraphqlWithToken(
    {
      query: userByEmailGQL,
      variables: {
        search: email
      }
    }
  )
  return res?.users?.nodes[0]?.databaseId || null
}
async function queryGraphqlUserById(id: string | number) {
  const UserByIdGQL = `
  query Query($search: String!) {
    users(where: {search: $search, searchColumns: ID}) {
      nodes {
        description
        email
        databaseId
        firstName
        lastName
        locale
        nickname
        nicename
        name
        slug
        username
        avatar {
          url
        }
      }
    }
  }
  `
  const res = await GraphqlService.queryGraphqlWithToken(
    {
      query: UserByIdGQL,
      variables: {
        search: `${id}`
      }
    }
  )
  const nodes = res?.users?.nodes
  if (!nodes) return null
  if (!nodes.length) return null
  const foundUser = nodes?.find(user => user?.databaseId == id)
  if (!foundUser) return null
  return foundUser
}

export const UserDataSchema = z.object({
    description: z.string(),
    email: z.string(),
    databaseId: z.string(),
    firstName: z.string(),
    extraCapabilities: z.string(),
    capabilities: z.string(),
    lastName: z.string(),
    locale: z.string(),
    nickname: z.string(),
    nicename: z.string(),
    name: z.string(),
    slug: z.string(),
    username: z.string(),
    avatar: z.object({
      url: z.string(),
    })
})

export const LoginUserOkSchema = z.object({
  membership: z.array(UserMembershipSchema),
  userData: UserDataSchema,
})
