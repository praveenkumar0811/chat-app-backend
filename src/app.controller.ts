import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller()
export class AppController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  getHello() {
    return {
      message: 'Chat backend running',
    };
  }

  @Get('db-test')
  async testDatabase() {
    const result = await this.dataSource.query('SELECT NOW()');

    return {
      status: 'success',
      database: 'connected',
      time: result[0].now,
    };
  }
}