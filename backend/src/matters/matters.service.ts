import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatterResponse } from './interfaces/matter-response.interface';

@Injectable()
export class MattersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number): Promise<MatterResponse[]> {
    const matters = await this.prisma.matter.findMany({
      where: { userId },
      include: { timeEntries: { select: { minutes: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return matters.map((matter) => ({
      id: matter.id,
      title: matter.title,
      clientName: matter.clientName,
      status: matter.status,
      totalMinutes: matter.timeEntries.reduce(
        (sum, entry) => sum + entry.minutes,
        0,
      ),
      createdAt: matter.createdAt,
      updatedAt: matter.updatedAt,
    }));
  }
}
