import { IsDateString, IsIn, IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class CreateTargetDto {
  @IsOptional()
  @IsUUID()
  userId?: string; // omit = company-wide target

  @IsIn(['CONFIRMED_ORDERS', 'DELIVERED_ORDERS', 'REVENUE', 'LEADS_CONVERTED'])
  metric: 'CONFIRMED_ORDERS' | 'DELIVERED_ORDERS' | 'REVENUE' | 'LEADS_CONVERTED';

  @IsInt()
  @IsPositive()
  targetValue: number;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}
