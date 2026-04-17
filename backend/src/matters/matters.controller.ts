import { Controller, Get } from '@nestjs/common';
import { MattersService } from './matters.service';
import type { MatterResponse } from './interfaces/matter-response.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Controller('matters')
export class MattersController {
  constructor(private readonly mattersService: MattersService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload): Promise<MatterResponse[]> {
    return this.mattersService.findAll(user.sub);
  }
}
