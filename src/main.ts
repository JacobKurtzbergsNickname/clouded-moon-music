import { NestFactory } from "@nestjs/core";
import { HttpStatus, Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Clouded Moon Music API")
    .setDescription("API for managing songs and music data")
    .setVersion("1.0")
    .addTag("songs")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = process.env["PORT"] ?? 3456;
  await app.listen(port);
  Logger.log(`Application is running on port ${port}`, "Bootstrap");
  Logger.log(
    `Swagger documentation available at http://localhost:${port}/api`,
    "Bootstrap",
  );
}
bootstrap();
