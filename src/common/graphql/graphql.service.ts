import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { GraphqlQuery } from './interfaces/graphq-service.interface';

@Injectable()
export class GraphqlService {
    constructor() {
        
    }
    static async generateGraphqlToken() {
        const loginGQL = `
        mutation LoginUser {
            login(
              input: {username: "${process.env.WP_ADMIN}", password: "${process.env.WP_PASS}"}
            ) {
              authToken
            }
          }`
        const {login} = await this.queryGraphql({
            query: loginGQL
        })
        if(!login) return
        return login.authToken
    }
    static async queryGraphql({query,variables,token}:GraphqlQuery) {
        const headers = !token ? {} : {
            headers: {
                Authorization: `Bearer ${token}`
            }
        } 
        const {data} = await axios.post(
            process.env.GRAPHQL_URL || '',
            {
                query,
                variables
            },
            headers
        ) 

        return data.data
    }
    static async queryGraphqlWithToken({ query, variables }: GraphqlQuery) { 
        const token = await this.generateGraphqlToken()
        const headers = !token ? {} : {
            headers: {
                Authorization: `Bearer ${token}`
            }
        } 
        const res = await axios.post(
            process.env.GRAPHQL_URL || '',
            {
                query,
                variables
            },
            headers
        )
        return res.data.data
    }
}
