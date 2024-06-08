import { ZodInfer } from "utils/zodTyping";
import { z } from "zod"

export const UserMembershipResponseFailedSchema = z.object({
  response: z.tuple([]),
})


const ProfileField = z.object({
  name: z.string(),
  slug: z.string(),
  value: z.string(),
});

export const UserMembershipSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  customer_data: z.array(z.unknown()),
  plan_id: z.number(),
  plan_name: z.string(),
  status: z.string(),
  order_id: z.nullable(z.number()),
  product_id: z.nullable(z.number()),
  subscription_id: z.nullable(z.number()),
  date_created: z.string(),
  date_created_gmt: z.string(),
  start_date: z.string(),
  start_date_gmt: z.string(),
  end_date: z.nullable(z.string()),
  end_date_gmt: z.nullable(z.string()),
  paused_date: z.nullable(z.string()),
  paused_date_gmt: z.nullable(z.string()),
  cancelled_date: z.nullable(z.string()),
  cancelled_date_gmt: z.nullable(z.string()),
  view_url: z.string(),
  profile_fields: z.array(ProfileField),
  meta_data: z.array(z.unknown()),
  _links: z.object({
    self: z.array(z.object({ href: z.string() })),
    collection: z.array(z.object({ href: z.string() })),
    customer: z.array(z.object({ href: z.string() })),
  }),
});


export const UserMembershipResponseOkSchema = z.object({
  response: z.record(UserMembershipSchema),
})
export type UserMembershipType = ZodInfer<typeof UserMembershipSchema>;

export const UserMembershipResponseSchema = z.union([
  UserMembershipResponseOkSchema,
  UserMembershipResponseFailedSchema,
])
