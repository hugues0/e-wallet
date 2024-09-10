import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guards';
import { SkipThrottle } from '@nestjs/throttler';
import { LoggedInUser } from 'src/auth/decorators';

@SkipThrottle()
@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  createWallet(
    @Body() walletDto: CreateWalletDto,
    @LoggedInUser('id') userId: string,
  ) {
    return this.walletService.createWallet(walletDto, userId);
  }
  @Get()
  findUserWallets(@LoggedInUser('id') userId: string) {
    return this.walletService.findUserWallets(userId);
  }
  @Get('/:id')
  findWalletById(@Param('id', ParseUUIDPipe) walletId: string) {
    return this.walletService.findWalletById(walletId);
  }
}
