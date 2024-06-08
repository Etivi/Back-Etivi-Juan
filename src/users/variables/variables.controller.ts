import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Put,
  Param,
} from "@nestjs/common"
import { ApiTags } from "@nestjs/swagger"
import {
  CreateContactVariableDto,
  CreateVariableDto,
} from "./dto/variables-create.dto"
import VariablesService from "./variables.service"
import { Private } from "src/common/decorators/private.decorator"
import { GetCurrentUserID } from "src/common/decorators/get-current-user-id.decorator"
import {
  DeleteContactVariableDto,
  DeleteVariableDto,
} from "./dto/variables-delete.dto"
import { UpdateVariableDto } from "./dto/variables-update.dto"

@ApiTags("Variables")
@Controller("variables")
@Private()
export default class VariablesController {
  constructor(private readonly service: VariablesService) {}
  @Post("create")
  async create(
    @Body() body: CreateVariableDto,
    @GetCurrentUserID() userID: string,
  ) {
    const { token: variableName, value: variableValue } = body
    return await this.service.createVariable(
      variableName,
      variableValue,
      userID,
    )
  }
  @Post("create/contact")
  async createContactVariable(
    @Body() body: CreateContactVariableDto,
    @GetCurrentUserID() userID: string,
  ) {
    const { token: variableName, value: variableValue, cellphoneNumber } = body
    return await this.service.createContactVariable(
      variableName,
      variableValue,
      cellphoneNumber,
      userID,
    )
  }

  @Get("get/contact/:cellphoneNumber")
  async getContactVariables(
    @Param("cellphoneNumber") cellphoneNumber: string,
    @GetCurrentUserID() userId: string,
  ) {
    if (cellphoneNumber === "all") {
      return this.service.getAllContactVariables(userId)
    }
    return this.service.getContactVariable(userId, cellphoneNumber)
  }

  @Delete("delete/contact/:cellphoneNumber")
  async deleteContactVariable(
    @Param("cellphoneNumber") cellphoneNumber: string,
    @Body() body: DeleteContactVariableDto,
    @GetCurrentUserID() userId: string,
  ) {
    return this.service.deleteContactVariable(
      userId,
      cellphoneNumber,
      body.token,
    )
  }

  @Put("put/contact/:cellphoneNumber")
  async putContactVariables(
    @Param("cellphoneNumber") cellphoneNumber: string,
    @GetCurrentUserID() userId: string,
    @Body() { variables }: { variables: { [x: string]: string } },
  ) {
    return this.service.updateContactVariables(
      variables,
      cellphoneNumber,
      userId,
    )
  }
  @Get()
  async get(@GetCurrentUserID() userID: string) {
    const variablesList = await this.service.getVariables(userID)
    return variablesList
  }

  @Delete()
  async delete(
    @Body() body: DeleteVariableDto,
    @GetCurrentUserID() userId: string,
  ) {
    const variablesList = await this.service.deleteVariable(userId, body.token)
    return variablesList
  }
  @Put()
  async update(
    @Body() body: UpdateVariableDto,
    @GetCurrentUserID() userId: string,
  ) {
    const variablesList = await this.service.updateVariable(
      userId,
      body.variables,
    )
    return variablesList
  }
}
