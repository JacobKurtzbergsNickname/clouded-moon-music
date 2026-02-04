export class MongoDbConfig {
  private readonly user: string;
  private readonly password: string;
  private readonly host: string;
  private readonly port: string;
  private readonly database: string;
  private readonly authSource: string;

  constructor(env: NodeJS.ProcessEnv) {
    this.user = env.MONGO_USER ?? "admin";
    this.password = env.MONGO_PASSWORD ?? "PreahChanTravPopookKrap2026";
    this.host = env.MONGO_HOST ?? "localhost";
    this.port = env.MONGO_PORT ?? "27019";
    this.database = env.MONGO_DATABASE ?? "clouded_moon_music";
    this.authSource = env.MONGO_AUTH_SOURCE ?? "admin";
  }

  getUri(): string {
    return `mongodb://${this.user}:${this.password}@${this.host}:${this.port}/${this.database}?authSource=${this.authSource}`;
  }
}

export const getMongoDbUri = (): string => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const config = new MongoDbConfig(process.env);
  return config.getUri();
};
