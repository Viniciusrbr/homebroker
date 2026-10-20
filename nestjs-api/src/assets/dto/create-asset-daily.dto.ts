import { IsDateString, IsNumber, IsPositive } from 'class-validator';

export class CreateAssetDailyDto {
  @IsDateString()
  date: string;

  @IsNumber()
  @IsPositive()
  price: number;
}
