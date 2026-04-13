import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Request } from "express";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { CMLogger } from "../logger";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CMLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - now;
        this.logger.info(`${method} ${url} - ${ms}ms`);
      }),
    );
  }
}
