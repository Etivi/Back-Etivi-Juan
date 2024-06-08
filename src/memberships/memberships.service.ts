import { Injectable } from "@nestjs/common"
import axios from "axios"
import { UserMembershipType } from "./types/user-membership.type"
import { MembershipPlan } from "./types/membership-plan.type"
import { IProduct } from "./types/product.type"
import ApiFetcher from "utils/APIFetch"
axios.defaults.baseURL = process.env.WP_API_URL

@Injectable()
export class MembershipsService {
  async getAll(): Promise<UserMembershipType[]> {
    try {
      const res = await axios.get("/wp-json/wc/v3/memberships/members")
      return res.data
    } catch (e) {
      return []
    }
  }
  async getUserMembershipByID(id: string) {
    try {
      const membershipList = await this.getUserMembershipList(id)

      if (!membershipList) return null
      const activeMemberships = membershipList.filter(
        membership => membership.status === "active",
      )
      const membership = await this.getFormattedMembershipList(
        activeMemberships,
      )
      return membership
    } catch (e) { }
    return null
  }
  async getFormattedMembershipList(membershipList: UserMembershipType[]) {
    const resdata = membershipList.sort((a, b) => {
      const dateA = new Date(a.start_date) as any
      const dateB = new Date(b.start_date) as any
      return dateB - dateA
    })
    const data = resdata.map(async membership => {
      const data = await this.getMembershipPlan(membership.plan_id)
      if (!data) return { ...membership, features: {} }
      const res = await this.getPlanProducts({
        ...data,
        date_created: membership.date_created,
        start_date: membership.start_date,
        end_date: membership.end_date,
        profile_fields: membership.profile_fields,
      })
      return res
    })
    const res = await Promise.all(data)
    return res
  }
  async getPlanProducts(plan: any) {
    const { _links, access_product_ids, ...data } = plan
    try {
      console.log({ plan })
      const free_plan_product = 9447
      if(plan.id === 12423) plan.access_product_ids.push(free_plan_product)
      const res = plan.access_product_ids.map(async productID => {
        const product = await this.getProductData(productID)
        console.log({product, productID})
        return product
      })
      const products = (await Promise.all(res)) as IProduct[]
      const subscriptionProduct = products.find(
        product => product.type === "subscription",
      )
      const FREE_IMAGE = "https://etivi.com/wp-content/uploads/2022/12/gratis-400x149.png"
      console.log({subscriptionProduct, products})
      return {
        ...data,
        image: subscriptionProduct?.images[0]?.src || (plan.slug === 'gratis' ? FREE_IMAGE : ""),
        features: this.getPlanAttributes(subscriptionProduct ? [subscriptionProduct] : (products || []), plan.profile_fields),
      }
    } catch (e) {
      console.error(e.message)
      return { ...data, features: {} }
    }
  }
  async getMembershipPlan(membershipID: number) {
    try {
      const data = await ApiFetcher<MembershipPlan>({
        url: `/wp-json/wc/v3/memberships/plans/${membershipID}`,
        token: process.env.WC_AUTH_KEY,
      })
      if (!data) return null
      return data
    } catch (e) {
      return null
    }
  }
  async getProductData(productID: number) {
    try {
      const data = await ApiFetcher<IProduct>({
        url: `/wp-json/wc/v3/products/${productID}`,
        token: process.env.WC_AUTH_KEY,
      })
      return data
    } catch (e) {
      return null
    }
  }
  getPlanAttributes(products: IProduct[], profileFields: any) {
    const fields = profileFields.map((field: any) => ({
      ...field,
      name: field.name,
      options: [field.value],
    }))
    console.log({products})
    const attributes = products.map(prod => prod.attributes).flat()
    console.log({attributes, fields})

    const features = [...attributes, ...fields].reduce((acc, item) => {
      const option = item.options[0]
      const value = Number(option)
      if (!isNaN(value) && option !== "") {
        acc[item.name] = (acc[item.name] || 0) + value
      } else if (option === "true" || option === "false") {
        acc[item.name] = option === "true"
          ? true
          : false
      } else if (option === "") {
        if (item.name === 'sesiones_whatsapp') {
          const val = (acc[item.name] || 0) + (value || 0)
          if (item.name === 'sesiones_whatsapp') {
            acc[item.name] = (val === 0) ? 1 : val
            return acc
          }
          acc[item.name] = val
          return acc
        }

        acc[item.name] = true
      }

      return acc
    }, {})
    if (Object.keys(features).length > 0) return features
    return {
      "sesiones_whatsapp": 1,
      "guardar_contactos": -1,
      "abrir_chat": true,
      "enviar_audios": true,
      "enviar_imagenes": true,
      "enviar_videos": true,
      "enviar_textos": true,
      "enviar_documentos": true,
      "enviar_encuestas": true,
      "enviar_estado": true,
      "exportar_backup": true
    }
  }
  async getUserMembershipList(id: string) {
    try {
      const data = await ApiFetcher<UserMembershipType[]>({
        url: `/wp-json/wc/v3/memberships/members?customer=${id}`,
        token: process.env.WC_AUTH_KEY,
      })
      if (!Array.isArray(data)) return []
      return data
    } catch (e) {
      return []
    }
  }
  async getFeatures(userID: string) {
    const memberships = await this.getUserMembershipByID(userID)
    if (!memberships?.length) return {}
    const features = memberships[0].features
    if (Object.keys(features).length > 0) return { memberships, features }
    return {
      memberships, features: {
        "sesiones_whatsapp": 1,
        "guardar_contactos": -1,
        "abrir_chat": true,
        "enviar_audios": true,
        "enviar_imagenes": true,
        "enviar_videos": true,
        "enviar_textos": true,
        "enviar_documentos": true,
        "enviar_encuestas": true,
        "enviar_estado": true,
        "exportar_backup": true
      }
    }
  }
}
