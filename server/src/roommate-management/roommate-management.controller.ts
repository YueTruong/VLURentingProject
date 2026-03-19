import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from 'src/auth/dto/register.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateRoommateRequestDto } from './dto/create-roommate-request.dto';
import { UpdateRoommateApprovalDto } from './dto/update-roommate-approval.dto';
import { UpdateRoommateTrackingDto } from './dto/update-roommate-tracking.dto';
import { RoommateManagementService } from './roommate-management.service';

@ApiTags('Roommate Management')
@ApiBearerAuth()
@Controller('roommate-management')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoommateManagementController {
  constructor(
    private readonly roommateManagementService: RoommateManagementService,
  ) {}

  @Get('listing-options')
  @ApiOperation({ summary: 'Get approved listings for roommate linking' })
  @Roles(UserRole.STUDENT)
  async getListingOptions() {
    return this.roommateManagementService.getListingOptions();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my roommate requests' })
  @Roles(UserRole.STUDENT)
  async findMine(@Req() req: any) {
    return this.roommateManagementService.findMine(req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create roommate request' })
  @Roles(UserRole.STUDENT)
  async create(
    @Body() createRoommateRequestDto: CreateRoommateRequestDto,
    @Req() req: any,
  ) {
    return this.roommateManagementService.create(
      createRoommateRequestDto,
      req.user,
    );
  }

  @Patch(':id/tracking')
  @ApiOperation({ summary: 'Update roommate tracking info' })
  @Roles(UserRole.STUDENT)
  async updateTracking(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoommateTrackingDto: UpdateRoommateTrackingDto,
    @Req() req: any,
  ) {
    return this.roommateManagementService.updateTracking(
      id,
      updateRoommateTrackingDto,
      req.user,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete roommate request' })
  @Roles(UserRole.STUDENT)
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.roommateManagementService.remove(id, req.user);
  }

  @Get('admin')
  @ApiOperation({ summary: 'Get roommate requests for admin review' })
  @Roles(UserRole.ADMIN)
  async findAllForAdmin(@Query('status') status?: string) {
    return this.roommateManagementService.findAllForAdmin(status);
  }

  @Patch('admin/:id/review')
  @ApiOperation({ summary: 'Approve or reject roommate request as admin' })
  @Roles(UserRole.ADMIN)
  async review(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoommateApprovalDto: UpdateRoommateApprovalDto,
    @Req() req: any,
  ) {
    return this.roommateManagementService.review(
      id,
      updateRoommateApprovalDto,
      req.user,
    );
  }
}
