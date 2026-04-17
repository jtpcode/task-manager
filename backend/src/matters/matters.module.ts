import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MattersController } from './matters.controller';
import { MattersService } from './matters.service';

@Module({
  imports: [PrismaModule],
  controllers: [MattersController],
  providers: [MattersService],
})
export class MattersModule {}
