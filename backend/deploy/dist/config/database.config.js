"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
exports.databaseConfig = {
    type: 'postgres',
    host: process.env.DB_HOST || 'algo-test-db.postgres.database.azure.com',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: 'postgres',
    password: 'Algo#1122',
    database: 'consumer-dev',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
    ssl: true,
    extra: {
        rejectUnauthorized: true
    },
    retryAttempts: 0,
    connectTimeoutMS: 5000,
};
//# sourceMappingURL=database.config.js.map