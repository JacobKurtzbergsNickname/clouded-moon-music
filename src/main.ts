// Load environment variables FIRST, before any imports
import dotenv from "dotenv";
dotenv.config();

// Now import everything else
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3456;
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(port);
  console.log(`Application is running on: ${port}`);
}
bootstrap();
