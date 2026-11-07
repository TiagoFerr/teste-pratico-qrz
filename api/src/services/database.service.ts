import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');
    if (connectionString) {
      this.pool = new Pool({ connectionString });
    } else {
      this.pool = new Pool({
        host: this.configService.get<string>('DB_HOST', 'localhost'),
        port: Number(this.configService.get<number>('DB_PORT', 5432)),
        user: this.configService.get<string>('DB_USER', 'postgres'),
        password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
        database: this.configService.get<string>('DB_NAME', 'portal_fornecedor'),
      });
    }
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  getPool(): Pool {
    return this.pool;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
