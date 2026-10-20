import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  image: string;
}
