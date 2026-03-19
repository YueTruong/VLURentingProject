import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum PostStatusAdmin {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  HIDDEN = 'hidden',
}

export class UpdatePostStatusDto {
  @IsEnum(PostStatusAdmin, {
    message: `Tráº¡ng thÃ¡i pháº£i lÃ  má»™t trong cÃ¡c giÃ¡ trá»‹: ${Object.values(
      PostStatusAdmin,
    ).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Tráº¡ng thÃ¡i khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng' })
  status: PostStatusAdmin;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'LÃ½ do tá»« chá»‘i khÃ´ng Ä‘Æ°á»£c quÃ¡ 500 kÃ½ tá»±' })
  rejectionReason?: string;
}
