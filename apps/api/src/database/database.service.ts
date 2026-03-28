import { Injectable, Inject } from '@nestjs/common';
import { Pool, PoolClient, QueryResult } from 'pg';
import { DATABASE_POOL } from './database.module';

@Injectable()
export class DatabaseService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      return await client.query<T>(sql, params);
    } finally {
      client.release();
    }
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
