import { Session } from "@prisma/client";

export default abstract class AuthServiceInterface{

    abstract createSession(data:CreateSessionData):Promise<Session | null>
    abstract getSessionLimit(userID:UserID):Promise<number>
}


type UserID = string;
interface CreateSessionData {
    userID: UserID;
    token: string;
}
