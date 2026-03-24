import { NestFactory, Reflector } from "@nestjs/core";
import {
  ClassSerializerInterceptor,
  HttpStatus,
  ValidationPipe,
} from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";

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

  app.useGlobalFilters(new HttpExceptionFilter());

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ClassSerializerInterceptor(reflector),
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
  console.log(`Application is running on: ${port}`);
  console.log(
    `Swagger documentation is available at: http://localhost:${port}/api`,
  );
}
bootstrap();
