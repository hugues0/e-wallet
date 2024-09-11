import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guards';
import { SkipThrottle } from '@nestjs/throttler';
import { LoggedInUser } from 'src/auth/decorators';

@SkipThrottle()
@ApiTags('Wallets')
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

  @Get('/:id/outgoing-transactions')
  async getOutGoingTransactions(
    @Param('id', ParseUUIDPipe) walletId: string,
    @LoggedInUser('id') userId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.walletService.getSentTransactions(
      userId,
      walletId,
      page,
      limit,
    );
  }

  @Get('/:id/incoming-transactions')
  async getIncomingTransactions(
    @Param('id', ParseUUIDPipe) walletId: string,
    @LoggedInUser('id') userId: string,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.walletService.getIncomingTransactions(
      userId,
      walletId,
      page,
      limit,
    );
  }

  @Get(':id/suggested-wallets')
  async getTopSentWallets(
    @LoggedInUser('id') userId: string,
    @Param('id') walletId: string,
  ) {
    return this.walletService.getTopSentWallets(userId, walletId);
  }
}
