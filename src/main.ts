import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { patchNestJsSwagger } from "nestjs-zod"
import { json } from "express"
import { WinstonModule } from "nest-winston"
import { format, transports } from "winston"
import 'winston-daily-rotate-file';

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    transports: [
      // file on daily rotation (error only)
      new transports.DailyRotateFile({
     // %DATE will be replaced by the current date
        filename: `../logs/%DATE%-error.log`, 
        level: 'error',
        format: format.combine(format.timestamp(), format.json()),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false, // don't want to zip our logs
        maxFiles: '30d', // will keep log until they are older than 30 days
      }),
      // same for all levels
      new transports.DailyRotateFile({
        filename: `../logs/%DATE%-combined.log`,
        format: format.combine(format.timestamp(), format.json()),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: false,
        maxFiles: '30d',
      }),
      new transports.Console({
        format: format.combine(
          format.cli(),
          format.splat(),
          format.timestamp(),
          format.printf((info) => {
            return `${info.timestamp} ${info.level}: ${info.message}`;
          }),
        ),
      }),
    ],
  })

  console.log = (...message: any[]) => {
    const logging = message.reduce((prev, curr, i) => ({ ...prev, ['log_'+i]: curr }),{})
    logger.log(`${JSON.stringify(logging, null, 2)}`)
  }
  console.error = (...message: string[]) => {
    const logging = message.reduce((prev, curr, i) => ({ ...prev, ['log_'+i]: curr }),{})
    logger.error(`${JSON.stringify(logging, null, 2)}`)
  }
  const app = await NestFactory.create(AppModule, {
    logger
  })
  patchNestJsSwagger()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("docs", app, document)
  app.enableCors({
    origin: "*",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  })
  app.use(json({ limit: '2500mb' }));

  await app.listen(80)
}
bootstrap()

const config = new DocumentBuilder()
  .setTitle("Etivi Backend")
  .setDescription("This is Etivi's Backend")
  .setVersion("1.0")
  .addTag("etivi")
  .addBearerAuth(
    {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
    "authorization",
  )
  .addSecurityRequirements("authorization")

  .build()
