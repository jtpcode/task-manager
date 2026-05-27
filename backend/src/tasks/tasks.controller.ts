import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import type {
  TaskResponse,
  SummaryResponse,
  TaskEntryResponse,
} from './interfaces/task-response.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateTaskEntryDto } from './dto/create-task-entry.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TaskResponse> {
    return this.tasksService.create(user.sub, createTaskDto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload): Promise<TaskResponse[]> {
    return this.tasksService.findAll(user.sub);
  }

  @Get(':id/task-entries')
  findTaskEntries(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<TaskEntryResponse[]> {
    return this.tasksService.findTaskEntriesByTask(user.sub, id);
  }

  @Post(':id/task-entries')
  addTaskEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTaskEntryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TaskEntryResponse> {
    return this.tasksService.createTaskEntry(user.sub, id, dto);
  }

  @Get(':id/summary')
  getTaskSummary(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<SummaryResponse> {
    return this.tasksService.getTaskSummary(user.sub, id);
  }
}
