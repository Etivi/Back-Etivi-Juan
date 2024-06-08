import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UnauthorizedException,
} from "@nestjs/common"
import { GooglePeopleService } from "./google-people.service"
import { ApiTags } from "@nestjs/swagger"
import { Private } from "src/common/decorators/private.decorator"
import { GetGoogleAuthClientToken } from "src/common/decorators/google/get-auth-client-token.decorator"
import { CreateContactDto } from "./dto"
import { GetCurrentUserID } from "src/common/decorators/get-current-user-id.decorator"
import {
  GooglePermission,
  GooglePermissions,
} from "src/common/decorators/google/google-permissions.decorator"
import { GooglePeopleContactsVariablesService } from "./google-people-contacts-variables.service"

@ApiTags("Google Contacts")
@Controller("google/people")
@GooglePermissions([GooglePermission.GooglePeople])
@Private()
export class GooglePeopleController {
  constructor(
    private readonly googlePeopleService: GooglePeopleService,
    private readonly GooglePeopleContactsVariablesService: GooglePeopleContactsVariablesService,
  ) {}

  @Get("/contacts")
  async getContacts(@GetGoogleAuthClientToken() googleAuthToken: string) {
    if (!googleAuthToken)
      throw new UnauthorizedException("No Google connection")
    const res = await this.googlePeopleService.getContacts(googleAuthToken)

    return res
  }
  @Get("/contacts/:cellphoneNumber")
  async getContact(
    @GetGoogleAuthClientToken() googleAuthToken: string,
    @Param("cellphoneNumber") cellphoneNumber: string,
    @GetCurrentUserID() userId: string,
  ) {
    if (!googleAuthToken)
      throw new UnauthorizedException("No Google connection")
    const res = await this.googlePeopleService.getContact(
      googleAuthToken,
      cellphoneNumber,
      undefined,
      userId,
    )
    return res
  }
  @Delete("/contacts/:cellphoneNumber")
  async deleteContact(
    @GetGoogleAuthClientToken() googleAuthToken: string,
    @Param("cellphoneNumber") cellphoneNumber: string,
    @GetCurrentUserID() userId: string,
  ) {
    if (!googleAuthToken)
      throw new UnauthorizedException("No Google connection")
    const res = await this.googlePeopleService.deleteContact(
      googleAuthToken,
      cellphoneNumber,
      userId,
    )
    return res
  }
  @Put("/contacts/:cellphoneNumber")
  async updateContact(
    @GetCurrentUserID() userId: string,
    @GetGoogleAuthClientToken() googleAuthToken: string,
    @Body() data: CreateContactDto,
  ) {
    const res = await this.googlePeopleService.updateContact(
      googleAuthToken,
      data,
      userId,
    )
    return res
  }
  @Post("/contacts")
  async createContact(
    @Body() body: CreateContactDto,
    @GetCurrentUserID() userID: string,
    @GetGoogleAuthClientToken() googleAuthToken: string,
  ) {
    if (!googleAuthToken)
      throw new UnauthorizedException("No Google connection")
    const res = await this.googlePeopleService.handleContactCreation(
      googleAuthToken,
      body,
      userID,
    )
    return res
  }

  @Get("/contacts/variables/:cellphoneNumber")
  async getContactVariables(
    @GetCurrentUserID() userId: string,
    @Param("cellphoneNumber") cellphoneNumber: string,
    @GetGoogleAuthClientToken() googleAuthToken: string,
  ) {
    if (!googleAuthToken)
      throw new UnauthorizedException("No Google connection")
    const res =
      await this.GooglePeopleContactsVariablesService.getContactVariables(
        googleAuthToken,
        cellphoneNumber,
        userId,
      )
    return res
  }
}
