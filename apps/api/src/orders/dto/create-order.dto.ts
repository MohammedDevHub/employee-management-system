import { IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsUUID()
  salesId: string;

  @IsNumber()
  @IsPositive()
  value: number;

  @IsOptional()
  @IsNumber()
  deliveryFee?: number;
}
