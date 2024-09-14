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
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { LoggedInUser } from 'src/auth/decorators';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guards';
import { TransactionOtpDto } from './dto/otp.dto';

@SkipThrottle()
@ApiTags('Transactions')
@Controller({ path: 'transactions', version: VERSION_NEUTRAL })
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate transaction' })
  @ApiCreatedResponse({
    status: 201,
    description: 'Transaction successfully initiated',
  })
  @ApiNotFoundResponse({
    status: 404,
    description: 'Sender/Receiver wallet ID could not be found',
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Insufficinet funds to initiate a transfer',
  })
  @Post()
  transactionRequest(
    @LoggedInUser('id') userId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionService.create(userId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm transaction with OTP delivered to email' })
  @ApiOkResponse({
    status: 200,
    description: 'Transaction successfully completed',
  })
  @ApiBadRequestResponse({
    status: 400,
    description: 'Transaction does not have pending status',
  })
  @ApiUnauthorizedResponse({
    status: 401,
    description: 'Invalid or expired OTP was provided',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the transaction ID to be marked as completed',
    required: true,
    type: String,
  })
  @ApiBody({ type: TransactionOtpDto })
  @SkipThrottle()
  @Patch('confirm/:id')
  confirmTransaction(
    @Param('id', ParseUUIDPipe) transactionId: string,
    @Body() dto: TransactionOtpDto,
  ) {
    return this.transactionService.confirmTransaction(dto, transactionId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieving authenticated user paginated transactions',
  })
  @ApiOkResponse({
    status: 200,
    description: 'Transaction successfully retrieved',
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
