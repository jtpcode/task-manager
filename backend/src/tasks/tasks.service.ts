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
  TaskResponse,
  SummaryResponse,
  TaskEntryResponse,
} from './interfaces/task-response.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateTaskEntryDto } from './dto/create-task-entry.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateTaskDto): Promise<TaskResponse> {
    const task = await this.prisma.task.create({
      data: { ...dto, userId },
    });

    return {
      id: task.id,
      title: task.title,
      status: task.status,
      totalMinutes: 0,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  async findAll(userId: number): Promise<TaskResponse[]> {
    const tasks = await this.prisma.task.findMany({
      where: { userId },
      include: { taskEntries: { select: { minutes: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      totalMinutes: task.taskEntries.reduce(
        (sum, entry) => sum + entry.minutes,
        0,
      ),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));
  }

  async findTaskEntriesByTask(
    userId: number,
    taskId: number,
  ): Promise<TaskEntryResponse[]> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    const entries = await this.prisma.taskEntry.findMany({
      where: { taskId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return entries.map((entry) => ({
      id: entry.id,
      description: entry.description,
      date: entry.date,
      minutes: entry.minutes,
      taskId: entry.taskId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));
  }

  async createTaskEntry(
    userId: number,
    taskId: number,
    dto: CreateTaskEntryDto,
  ): Promise<TaskEntryResponse> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    const entry = await this.prisma.taskEntry.create({
      data: {
        description: dto.description,
        minutes: dto.minutes,
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        taskId,
      },
    });

    return {
      id: entry.id,
      description: entry.description,
      date: entry.date,
      minutes: entry.minutes,
      taskId: entry.taskId,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  }

  async getTaskSummary(
    userId: number,
    taskId: number,
  ): Promise<SummaryResponse> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
      include: { taskEntries: { orderBy: { date: 'desc' } } },
    });

    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    if (task.taskEntries.length === 0) {
      throw new BadRequestException(
        'Cannot generate a summary: no task entries have been logged for this task.',
      );
    }

    const apiKey = process.env['GOOGLE_AI_API_KEY'];
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'LLM API key is not configured on the server.',
      );
    }

    const totalMinutes = task.taskEntries.reduce(
      (sum, entry) => sum + entry.minutes,
      0,
    );
    const totalHours = (totalMinutes / 60).toFixed(1);

    const entriesText = task.taskEntries
      .map(
        (entry) =>
          `- ${entry.date.toISOString().slice(0, 10)}: ${entry.description} (${entry.minutes} min)`,
      )
      .join('\n');

    const prompt =
      `You are a task management assistant writing a plain-English activity summary on the task entries related to a task.\n` +
      `Your summary must:\n` +
      `  1. Open with a one-sentence overview of the main work performed.\n` +
      `  2. Highlight any key milestones, blockers, decisions, or progress made (2–3 sentences).\n` +
      `  3. Close with a brief note on the current status of the task.\n` +
      `Keep the total length to 4–5 sentences.\n\n` +
      `Task: ${task.title}\n` +
      `Status: ${task.status}\n` +
      `Total time logged: ${totalHours} hours (${totalMinutes} minutes)\n\n` +
      `Task entries (most recent first):\n${entriesText}`;

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
