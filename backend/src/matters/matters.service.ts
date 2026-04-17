import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';
import {
  MatterResponse,
  SummaryResponse,
  TimeEntryResponse,
} from './interfaces/matter-response.interface';
import { CreateMatterDto } from './dto/create-matter.dto';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';

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

  async findTimeEntriesByMatter(
    userId: number,
    matterId: number,
  ): Promise<TimeEntryResponse[]> {
    const matter = await this.prisma.matter.findFirst({
      where: { id: matterId, userId },
    });

    if (!matter) {
      throw new NotFoundException(`Matter with id ${matterId} not found`);
    }

    const entries = await this.prisma.timeEntry.findMany({
      where: { matterId },
      orderBy: { date: 'desc' },
    });

    return entries.map((entry) => ({
      id: entry.id,
      description: entry.description,
      date: entry.date,
      minutes: entry.minutes,
      matterId: entry.matterId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));
  }

  async createTimeEntry(
    userId: number,
    matterId: number,
    dto: CreateTimeEntryDto,
  ): Promise<TimeEntryResponse> {
    const matter = await this.prisma.matter.findFirst({
      where: { id: matterId, userId },
    });

    if (!matter) {
      throw new NotFoundException(`Matter with id ${matterId} not found`);
    }

    const entry = await this.prisma.timeEntry.create({
      data: {
        description: dto.description,
        minutes: dto.minutes,
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        matterId,
      },
    });

    return {
      id: entry.id,
      description: entry.description,
      date: entry.date,
      minutes: entry.minutes,
      matterId: entry.matterId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  async getMatterSummary(
    userId: number,
    matterId: number,
  ): Promise<SummaryResponse> {
    const matter = await this.prisma.matter.findFirst({
      where: { id: matterId, userId },
      include: { timeEntries: { orderBy: { date: 'desc' } } },
    });

    if (!matter) {
      throw new NotFoundException(`Matter with id ${matterId} not found`);
    }

    if (matter.timeEntries.length === 0) {
      throw new BadRequestException(
        'Cannot generate a summary: no time entries have been logged for this matter.',
      );
    }

    const apiKey = process.env['GOOGLE_AI_API_KEY'];
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'LLM API key is not configured on the server.',
      );
    }

    const entriesText = matter.timeEntries
      .map(
        (entry) =>
          `- ${entry.date.toISOString().slice(0, 10)}: ${entry.description} (${entry.minutes} minutes)`,
      )
      .join('\n');

    const prompt =
      `You are a legal work summarizer. Summarize the work logged for the following legal matter in 2–4 concise, readable sentences suitable for a client update.\n\n` +
      `Matter: ${matter.title}\n` +
      `Client: ${matter.clientName}\n` +
      `Status: ${matter.status}\n\n` +
      `Logged time entries:\n${entriesText}`;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return { summary: response.text ?? '' };
    } catch {
      throw new InternalServerErrorException(
        'Failed to generate summary. Please try again.',
      );
    }
  }
}
