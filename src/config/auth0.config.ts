export class Auth0Config {
  readonly domain: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly audience: string;
  readonly callbackUrl: string;
  readonly logoutUrl: string;
  readonly baseUrl: string;

  constructor(env: NodeJS.ProcessEnv) {
    this.domain = env.AUTH0_DOMAIN ?? "";
    this.clientId = env.AUTH0_CLIENT_ID ?? "";
    this.clientSecret = env.AUTH0_CLIENT_SECRET ?? "";
    this.audience = env.AUTH0_AUDIENCE ?? "";
    this.callbackUrl =
      env.AUTH0_CALLBACK_URL ?? `http://localhost:${env.PORT ?? 3456}/callback`;
    this.logoutUrl =
      env.AUTH0_LOGOUT_URL ?? `http://localhost:${env.PORT ?? 3456}`;
    this.baseUrl =
      env.AUTH0_BASE_URL ?? `http://localhost:${env.PORT ?? 3456}`;
  }

  get issuerBaseUrl(): string {
    return `https://${this.domain}`;
  }

  validate(): string[] {
    const missing: string[] = [];
    if (!this.domain) missing.push("AUTH0_DOMAIN");
    if (!this.clientId) missing.push("AUTH0_CLIENT_ID");
    if (!this.clientSecret) missing.push("AUTH0_CLIENT_SECRET");
    return missing;
  }
}

export const getAuth0Config = (): Auth0Config => {
  return new Auth0Config(process.env);
};
