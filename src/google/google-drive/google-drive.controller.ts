import { Controller, UnauthorizedException } from "@nestjs/common"
import {
  Body,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common/decorators"
import { GoogleDriveService } from "./google-drive.service"
import { ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger"
import { Private } from "src/common/decorators/private.decorator"
import { Response } from "express"
import { FileInterceptor } from "@nestjs/platform-express"
import { GetGoogleAuthClientToken } from "src/common/decorators/google/get-auth-client-token.decorator"
import { GooglePermission, GooglePermissions } from "src/common/decorators/google/google-permissions.decorator"
import axios from "axios"
import { GoogleResumableDto } from "../dto/google-resumable.dto"
@ApiTags("Google Drive")
@Controller("google/drive")
@GooglePermissions([GooglePermission.GoogleDrive])
@Private()
export class GoogleDriveController {
  constructor(private readonly GoogleDriveService: GoogleDriveService) { }
  @Get("/files")
  async getFiles(@GetGoogleAuthClientToken() googleToken: string) {
    if (!googleToken) throw new UnauthorizedException("No Google connection")

    const res = await this.GoogleDriveService.getFiles(googleToken)

    return res
  }
  @Get("/files/:id/download")
  async downloadFile(
    @GetGoogleAuthClientToken() googleToken: string,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    if (!googleToken) throw new UnauthorizedException("No Google connection")

    try {
      return await this.GoogleDriveService.downloadFileAndFormatRes({
        token: googleToken,
        id,
        res,
      })
    } catch (e) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Unauthorized",
        errors: e.errors,
      })
    }
  }
  @Delete("/files/:id")
  async deleteFile(
    @GetGoogleAuthClientToken() googleToken: string,
    @Param("id") id: string
  ) {
    if (!googleToken) throw new UnauthorizedException("No Google connection")

    try {
      return await this.GoogleDriveService.deleteFile({
        token: googleToken,
        id,
      })
    } catch (e) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Unauthorized",
        errors: e.errors,
      })
    }
  }
  @Get("db/download-latest")
  async exportDB(
    @GetGoogleAuthClientToken() googleToken: string,
    @Res() res: Response,
  ) {
    if (!googleToken) throw new UnauthorizedException("No Google connection")

    try {
      return await this.GoogleDriveService.exportDB({
        token: googleToken,
        res,
      })
    } catch (e) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Unauthorized",
        errors: e.errors,
      })
    }
  }
  @Get("db")
  async getAllDB(@GetGoogleAuthClientToken() googleToken: string) {
    if (!googleToken) throw new UnauthorizedException("No Google connection")
    try {
      return await this.GoogleDriveService.findFiles({
        token: googleToken,
        query: "etivi",
      })
    } catch (e) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Unauthorized",
        errors: e.errors,
      })
    }
  }

  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "File to be uploaded",

    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @Post("/")
  @UseInterceptors(FileInterceptor("file", {
    limits: {
      fileSize: 10485760000
    }
  }))
  async uploadFile(
    @Res() res,
    @UploadedFile() file,
    @GetGoogleAuthClientToken() googleAuthToken: string,
  ) {
    console.log('google upload file called')
    console.log('google upload file called')
    console.log('google upload file called')
    if (!googleAuthToken)
      throw new UnauthorizedException("No Google connection")
    console.log({ googleAuthToken })
    try {

      const createdFile = await this.GoogleDriveService.uploadFile({
        token: googleAuthToken,
        file,
      })
      console.log({ createdFile })
      return res.send(createdFile)
    } catch (e) {

      throw new UnauthorizedException({
        statusCode: 401,
        message: "Unauthorized",
        errors: e.errors,
      })
    }
  }
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "File to be uploaded",

    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @Put("/:id")
  @UseInterceptors(FileInterceptor("file", {
    limits: {
      fileSize: 10485760000,
    }
  }))
  async updateFile(
    @Res() res,
    @UploadedFile() file,
    @GetGoogleAuthClientToken() googleAuthToken: string,
    @Param('id') id: string
  ) {

    if (!googleAuthToken)
      throw new UnauthorizedException("No Google connection")

    const createdFile = await this.GoogleDriveService.updateDatabase({
      token: googleAuthToken,
      id,
      file
    })
    return res.send(createdFile)

  }

  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "File to be uploaded",

    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @Post("/resumable")
  async startUploadSession(@Res() res: Response,
    @GetGoogleAuthClientToken() googleToken: string, @Body() body: GoogleResumableDto) {
    try {

      const { headers, data } = await axios.post("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable", {
        "name": body.name,
        "mimeType": body.type,
      }, {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': body.size,
          'X-Upload-Content-Type': body.type,
          'Authorization': 'Bearer ' + googleToken
        },
      })
      console.log({ data })
      res.send({ sessionUrl: headers.location, googleToken })
    } catch (error) {
      console.log(error)
      res.send({ test: 'error' })
    }
  }

  @Get("/lastFile")
  async getLastFileUploaded(@Res() res: Response,
    @GetGoogleAuthClientToken() googleToken: string) {
    try {
      const drive = await this.GoogleDriveService.getDriveClient(googleToken)
      const files = await drive.files.list({
        orderBy: 'createdTime desc', // You can also use 'modifiedTime desc'
        pageSize: 1, // Only retrieve the latest file
        fields: 'files(id, name)',
      })
      const fileList = files?.data?.files
      if (!fileList?.length) return res.send({ })
      res.send({ file: fileList[0] })
    } catch (error) {
      res.send()
    }
  }
}
