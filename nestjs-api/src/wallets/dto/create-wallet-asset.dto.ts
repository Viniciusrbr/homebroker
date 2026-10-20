import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class CreateWalletAssetDto {
  @IsUUID()
  assetId: string;

  @IsInt()
  @IsPositive()
  shares: number;
}
