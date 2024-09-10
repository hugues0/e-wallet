import { Injectable } from '@nestjs/common';
import { DATABASE_URL } from 'src/common/constants';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get(DATABASE_URL),
        },
      },
    });
  }
}
