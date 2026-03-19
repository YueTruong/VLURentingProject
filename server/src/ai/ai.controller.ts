import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { HousingQueryDto } from './dto/housing-query.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('housing-query')
  async parseHousingQuery(@Body() body: HousingQueryDto) {
    return this.aiService.parseHousingQuery(body.message, body.districtOptions ?? []);
  }
}
