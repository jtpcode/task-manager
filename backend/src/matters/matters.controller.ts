import { Controller, Get, Post, Body } from '@nestjs/common';
import { MattersService } from './matters.service';
import type { MatterResponse } from './interfaces/matter-response.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateMatterDto } from './dto/create-matter.dto';

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
}
