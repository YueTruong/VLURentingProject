import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoommateManagementService } from './roommate-management.service';
import { CreateRoommateRequestDto } from './dto/create-roommate-request.dto';

@Controller('roommate-management')
@UseGuards(JwtAuthGuard)
export class RoommateManagementController {
  constructor(
    private readonly roommateManagementService: RoommateManagementService,
  ) {}

  @Get('listings')
  async getListings() {
    return this.roommateManagementService.getListings();
  }

  @Get('posts')
  async getPosts(@Req() req, @Query('listingId') listingId?: string) {
    const parsedListingId = listingId ? Number(listingId) : undefined;
    return this.roommateManagementService.getRoommatePosts(
      req.user.id,
      Number.isFinite(parsedListingId) ? parsedListingId : undefined,
    );
  }

  @Post('requests')
  async createRoommateRequest(
    @Req() req,
    @Body() payload: CreateRoommateRequestDto,
  ) {
    return this.roommateManagementService.createRoommateRequest(
      req.user.id,
      req.user.role,
      payload,
    );
  }
}
