import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common"
import { GoogleService } from "../google.service"
import { google } from "googleapis"
import { Response } from "express"
import { Readable } from "stream"
@Injectable()
export class GoogleDriveService {
  async getDriveClient(token: string) {
    const authClient = await GoogleService.getGoogleAuth(token)
    const dataAT = await authClient.getAccessToken()
    return google.drive({
      version: "v3",
      auth: authClient,
    })
  }
  async getGoogleClient(token: string) {
    const authClient = await GoogleService.getGoogleAuth(token)
    const dataAT = await authClient.getAccessToken()
    return dataAT
  }
  async getFiles(token: string) {
    const drive = await this.getDriveClient(token)
    try {
      const res = await drive.files.list({
        pageSize: 1000,
        fields: "nextPageToken, files(*)",
      })
      return res
    } catch (e) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Unauthorized",
        errors: e.errors,
      })
    }
  }
  async downloadFile({ token, id }: { token: string; id: string }) {
    const drive = await this.getDriveClient(token)
    const { data } = await drive.files.get({
      fileId: id,
      fields: "name",
    })
    const fileName = data.name
    const file = await drive.files.get(
      {
        fileId: id,
        alt: "media",
      },
      {
        responseType: "stream",
      },
    )
    return { file, fileName }
  }
  async deleteFile({ token, id }: { token: string; id: string }) {
    const drive = await this.getDriveClient(token)
    const data = await drive.files.delete({
      fileId: id,
    })
    return true
  }
  async downloadFileAndFormatRes({
    token,
    id,
    res,
  }: {
    token: string
    id: string
    res: Response
  }) {
    const { file, fileName } = await this.downloadFile({ token, id })
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"; filename*=UTF-8''${fileName}`,
    )
    res.set("Content-Type", "application/octet-stream")
    return await file.data.pipe(res)
  }
  async findFiles({ token, query }: { token: string; query: string }) {
    const drive = await this.getDriveClient(token)
    try {
      const res = await drive.files.list({
        q: `name contains '${query}'`,
        fields: "files(*)",
      })
      return res.data.files
    } catch (e) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: "Unauthorized",
        errors: e.errors,
      })
    }
  }
  async exportDB({ token, res }: { token: string; res: Response }) {
    const drive = await this.getDriveClient(token)
    const foundFiles = await drive.files.list({
      q: "name = 'db.etivi'",
    })

    if (
      foundFiles?.data?.files?.length &&
      foundFiles?.data?.files?.length > 0
    ) {
      return await this.downloadFileAndFormatRes({
        token,
        id: foundFiles.data.files[0].id!,
        res,
      })
    }
    throw new BadRequestException()
  }
  // rome-ignore lint/suspicious/noExplicitAny: <explanation>
  async uploadFile({ token, file }: { token: string; file: any }) {
    console.log('calld service')
    const drive = await this.getDriveClient(token)
    const fileMetadata = {
      name: file.originalname,
    }
    const media = {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer),
    }
    console.log('calld service')
    try {
      console.log('calld service2')
      const res: any = await drive.files.create({
        // @ts-ignore
        resource: fileMetadata,
        media: media,
        fields: "id,name",
        uploadType: "resumable",
      })
      if (!res.data?.id) throw new Error()
      return { id: res.data?.id, name: res.data?.name }
    } catch (e) {
      console.log({ e })
      throw new BadRequestException({
        statusCode: 400,
        message: "Error al crear la base de datos",
        errors: e.errors,
      })
    }
  }

  async updateDatabase({
    token,
    file,
    id,
  }: {
    token: string
    file: any
    id: string
  }) {
    const drive = await this.getDriveClient(token)
    const media = {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer),
    }
    try {
      // @ts-ignore
      const res: any = await drive.files.update({
        fileId: id,
        media,
        fields: "id,name",
        uploadType: "resumable",
      })
      if (!res.data?.id) throw new Error()
      return { id: res.data?.id, name: res.data?.name }
    } catch (e) {
      if (e.response?.data?.error?.code === 404) {
        throw new NotFoundException({
          message: "Copia de seguridad no encontrada",
        })
      }
      throw new BadRequestException({
        statusCode: 400,
        message: "Error al actualizar la base de datos",
        errors: e.errors,
      })
    }
  }
}
