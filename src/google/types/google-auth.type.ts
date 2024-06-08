import { OAuth2Client, TokenInfo } from "google-auth-library"

export interface GoogleAuthWithTokenInfo {
  authClient: OAuth2Client
  tokenInfo: TokenInfo
}
