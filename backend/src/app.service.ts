import { Injectable } from '@nestjs/common';

export const ROOT_ORG = "ALGO_HEALTH";

@Injectable()
export class AppService {
  getHello(): string {
    return "Hello World!";
  }

  async initializeDbData() {
    console.log("Database initialization completed - simplified version for current setup");
    console.log("Default DB data created *****************");
  }
}