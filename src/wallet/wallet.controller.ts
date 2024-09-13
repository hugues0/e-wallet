import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guards';
import { SkipThrottle } from '@nestjs/throttler';
import { LoggedInUser } from 'src/auth/decorators';

@SkipThrottle()
@ApiTags('Wallets')
@Controller({ path: 'wallets', version: VERSION_NEUTRAL })
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a user wallet' })
  @ApiResponse({ status: 201, description: 'Wallet successfully created' })
  @ApiResponse({
    status: 409,
    description: 'User already has provided currency wallet',
  })
  @Post()
  createWallet(
    @Body() walletDto: CreateWalletDto,
    @LoggedInUser('id') userId: string,
  ) {
    return this.walletService.createWallet(walletDto, userId);
  }
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Return all wallets registered to authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Wallets successfully retrieved' })
  @Get()
  findUserWallets(@LoggedInUser('id') userId: string) {
    return this.walletService.findUserWallets(userId);
  }
  @ApiResponse({ status: 200, description: 'Wallet successfully retrieved' })
  @ApiResponse({
    status: 404,
    description: 'Wallet with provided ID could not be found',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Return a single wallet and its owner details',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the wallet to be retrieved',
    required: true,
    type: String,
  })
  @Get('/:id')
  findWalletById(@Param('id', ParseUUIDPipe) walletId: string) {
    return this.walletService.findWalletById(walletId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieving authenticated user outgoing transactions',
  })
  @ApiResponse({
    status: 404,
    description:
      'Wallet with provided ID could not be found or does belong to user',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet outgoing transactions successfull retrieved',
  })
  @ApiParam({
    name: 'id',
    description: 'Wallet ID to retrieve outgoing transactions for',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: true,
    description: 'Pagination for transactions, defaults to 1',
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    required: true,
    description: 'number of transactions per page,defaults to 10',
    type: String,
  })
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

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieving authenticated user incoming transactions',
  })
  @ApiResponse({
    status: 404,
    description:
      'Wallet with provided ID could not be found or does belong to user',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallet incoming transactions successfull retrieved',
  })
  @ApiParam({
    name: 'id',
    description: 'Wallet ID to retrieve incoming transactions for',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: true,
    description: 'Pagination for transactions, defaults to 1',
    type: String,
  })
  @ApiQuery({
    name: 'limit',
    required: true,
    description: 'number of transactions per page,defaults to 10',
    type: String,
  })
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

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Retrieve suggested wallets to transfer to (most transferred to in the last 3 months)',
  })
  @ApiResponse({
    status: 200,
    description: 'Wallets suggestions successfully retrieved',
  })
  @ApiResponse({
    status: 404,
    description:
      'Wallet with provided ID could not be found or does belong to user',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the wallet to get suggestions for',
    required: true,
    type: String,
  })
  @Get(':id/suggested-wallets')
  async getTopSentWallets(
    @LoggedInUser('id') userId: string,
    @Param('id') walletId: string,
  ) {
    return this.walletService.getTopSentWallets(userId, walletId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate montly wallet statement',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the wallet to generate report for',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 404,
    description:
      'Wallet with provided ID could not be found or does belong to user',
  })
  @Get(':id/monthly-statement')
  async getWalletStatement(
    @LoggedInUser('id') userId: string,
    @Param('id') walletId: string,
  ) {
    return this.walletService.generateMonthlyReport(userId, walletId);
  }
}
