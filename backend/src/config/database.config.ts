import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'algo-test-db.postgres.database.azure.com',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: 'postgres',
  password: 'Algo#1122',
  database: 'consumer-dev',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  ssl: true, 
  extra:{
    rejectUnauthorized: true
  },
  retryAttempts: 0, // Disable retries to prevent hanging
  connectTimeoutMS: 5000,
};
