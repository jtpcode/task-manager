import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatterResponse } from './interfaces/matter-response.interface';
import { CreateMatterDto } from './dto/create-matter.dto';

@Injectable()
export class MattersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateMatterDto): Promise<MatterResponse> {
    const matter = await this.prisma.matter.create({
      data: { ...dto, userId },
    });

    return {
      id: matter.id,
      title: matter.title,
      clientName: matter.clientName,
      status: matter.status,
      totalMinutes: 0,
      createdAt: matter.createdAt,
      updatedAt: matter.updatedAt,
    };
  }

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
