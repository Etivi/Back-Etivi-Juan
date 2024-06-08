import { people_v1 } from "googleapis"

export interface FormatContactData {
  name?: string | null
  lastName?: string | null
  phone?: string | null
  email?: string | null
  photo?: string | null
  birthday?: string | null
  organization?: string | null
  city?: string | null
  country?: string | null
  address?: string | null
  web?: string | null
  groups?: people_v1.Schema$Membership[] | null
}

type Keys = "names" | "phoneNumbers" | "birthdays" | "emailAddresses" | "urls"
