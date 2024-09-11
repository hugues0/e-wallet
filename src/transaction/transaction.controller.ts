import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { LoggedInUser } from 'src/auth/decorators';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guards';
import { TransactionOtpDto } from './dto/otp.dto';

@SkipThrottle()
@ApiTags('Transactions')
@Controller('transaction')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  transactionRequest(
    @LoggedInUser('id') userId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionService.create(userId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @SkipThrottle()
  @Patch('confirm/:id')
  confirmTransaction(
    @Param('id', ParseUUIDPipe) transactionId: string,
    @Body() dto: TransactionOtpDto,
  ) {
    return this.transactionService.confirmTransaction(dto, transactionId);
  }

  @Get()
  async getTransactions(
    @LoggedInUser('id') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    return this.transactionService.getTransactions(
      userId,
      pageNumber,
      limitNumber,
    );
  }
}
