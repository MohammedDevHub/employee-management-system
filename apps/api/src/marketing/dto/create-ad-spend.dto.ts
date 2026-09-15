import { IsDateString, IsIn, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateAdSpendDto {
  @IsIn(['MANUAL', 'FACEBOOK', 'GOOGLE'])
  source: 'MANUAL' | 'FACEBOOK' | 'GOOGLE';

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  campaign?: string;
}
