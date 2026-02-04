import { NestFactory } from "@nestjs/core";
import * as dotenv from "dotenv";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(port);
  console.log(`Application is running on: ${port}`);
}
bootstrap();
