import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { MattersService } from './matters.service';
import type {
  MatterResponse,
  TimeEntryResponse,
} from './interfaces/matter-response.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateMatterDto } from './dto/create-matter.dto';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';

@Controller('matters')
export class MattersController {
  constructor(private readonly mattersService: MattersService) {}

  @Post()
  create(
    @Body() createMatterDto: CreateMatterDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MatterResponse> {
    return this.mattersService.create(user.sub, createMatterDto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload): Promise<MatterResponse[]> {
    return this.mattersService.findAll(user.sub);
  }

  @Get(':id/time-entries')
  findTimeEntries(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<TimeEntryResponse[]> {
    return this.mattersService.findTimeEntriesByMatter(user.sub, id);
  }

  @Post(':id/time-entries')
  addTimeEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTimeEntryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TimeEntryResponse> {
    return this.mattersService.createTimeEntry(user.sub, id, dto);
  }
}
