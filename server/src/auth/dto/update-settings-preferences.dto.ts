import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSettingsPreferencesDto {
  @IsString()
  @IsOptional()
  @MaxLength(30)
  language?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  timezone?: string;

  @IsBoolean()
  @IsOptional()
  readReceiptsEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  postPrivacySearchEngine?: boolean;

  @IsBoolean()
  @IsOptional()
  postPrivacyHometown?: boolean;

  @IsBoolean()
  @IsOptional()
  postPrivacyExpertType?: boolean;

  @IsBoolean()
  @IsOptional()
  postPrivacyJoinedTime?: boolean;

  @IsBoolean()
  @IsOptional()
  postPrivacyBookedServices?: boolean;

  @IsBoolean()
  @IsOptional()
  stopAllMarketingEmails?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOfferHostRecognition?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOfferTripOffers?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOfferPriceSuggestions?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOfferHostPerks?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOfferNewsAndPrograms?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOfferLocalRegulations?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOfferInspirationAndDeals?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOfferTripPlanning?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyAccountNewDeviceLogin?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyAccountSecurityUpdates?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyAccountPaymentActivity?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyAccountProfileReminders?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyAccountVerificationReminders?: boolean;

  @IsBoolean()
  @IsOptional()
  notifyAccountSupportTips?: boolean;
}
