import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class JoinAssetDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;
}

export class JoinAssetsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  symbols: string[];
}
