import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GooglePermission, GooglePermissions } from 'src/common/decorators/google/google-permissions.decorator';
import { Private } from 'src/common/decorators/private.decorator';
import { GoogleGroupsService } from './google-groups.service';
import { GetGoogleAuthClientToken } from 'src/common/decorators/google/get-auth-client-token.decorator';

@ApiTags("Google Contacts")
@Controller("google/groups")
@GooglePermissions([GooglePermission.GooglePeople])
@Private()
export class GoogleGroupsController {
    constructor(private googleGroups:GoogleGroupsService){}
    @Get('/')
    async getGroups(@GetGoogleAuthClientToken() googleAuthToken: string) {
        if (!googleAuthToken)
            throw new UnauthorizedException("No Google connection")
        const allGroups = await this.googleGroups.getAllGroups(googleAuthToken)
        return {allGroups, success:true}
    }
}
