import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  userId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @IsInt()
  @Min(1)
  @Max(5)
  managerRating: number;

  @IsOptional()
  @IsString()
  note?: string;
}
