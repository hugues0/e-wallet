import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OneTimePassCodeService } from 'src/one-time-pass-code/one-time-pass-code.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TransactionOtpDto } from './dto/otp.dto';
import { TransactionStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private otpService: OneTimePassCodeService,
    @InjectQueue('otp') private otpQueue: Queue,
  ) {}
  async create(userId: string, dto: CreateTransactionDto) {
    try {
      const senderWallet = await this.findWallet(dto.senderWalletId);
      if (!senderWallet) {
        throw new NotFoundException(
          `Sender wallet ${dto.senderWalletId} not found`,
        );
      }
      if (senderWallet && senderWallet.userId !== userId) {
        throw new NotFoundException(
          `Sender wallet ${dto.senderWalletId} not found`,
        );
      }
      if (senderWallet && senderWallet.currency !== dto.currency) {
        throw new BadRequestException(
          `Receiver wallet ${dto.receiverWalletId} does not support currency ${dto.currency}`,
        );
      }
      const receiverWallet = await this.findWallet(dto.receiverWalletId);
      if (!receiverWallet) {
        throw new NotFoundException(
          `Reciver wallet ${dto.receiverWalletId} not found`,
        );
      }

      if (senderWallet && +senderWallet.balance < dto.amount) {
        throw new NotFoundException(
          `Insufficient funds, please load more funds on your wallet and try again`,
        );
      }

      const { otpExpiresAt, otp, hashedOtp } =
        await this.otpService.generateOtp();

      const refNumber = `${dto.type}-${dto.senderWalletId}`;
      const [transaction] = await this.prisma.$transaction([
        this.prisma.transaction.create({
          data: {
            ...dto,
            refNumber,
            userId,
            otp: hashedOtp,
            otpExpiresAt,
          },
        }),
        this.prisma.wallet.update({
          data: {
            balance: +senderWallet.balance - dto.amount,
          },
          where: { id: senderWallet.id },
        }),
      ]);

      const queueData = {
        to: senderWallet.user.email,
        templateId: process.env.OTP_TEMPLATE_ID,
        dynamicData: {
          firstName: senderWallet.user.firstName,
          receiverName: receiverWallet.user.firstName,
          otp,
        },
      };

      await this.otpQueue.add(
        `transaction ref ${refNumber} otp Email`,
        queueData,
        {
          attempts: 3,
          backoff: 3000,
          removeOnComplete: true,
        },
      );

      return {
        message: `We have sent you an OTP  to confirm transaction. OTP expires in 5 min`,
        data: {
          id: transaction.id,
          ...dto,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async confirmTransaction(dto: TransactionOtpDto, transactionId: string) {
    const transactionExists = await this.prisma.transaction.findUnique({
      where: {
        id: transactionId,
      },
      include: {
        senderWallet: true,
      },
    });
    if (!transactionExists) {
      throw new NotFoundException(
        `Transaction with id ${transactionId} not found`,
      );
    }
    if (transactionExists.status !== TransactionStatus.PENDING) {
      throw new ForbiddenException(
        `Transaction with id ${transactionId} is not pending`,
      );
    }
    const hashMatch = await bcrypt.compare(`${dto.otp}`, transactionExists.otp);
    if (new Date() > transactionExists.otpExpiresAt || !hashMatch) {
      throw new UnauthorizedException('Invalid OTP or OTP has expired');
    }

    const receiverWallet = await this.findWallet(
      transactionExists.receiverWalletId,
    );

    const [transaction, wallet] = await this.prisma.$transaction([
      this.prisma.transaction.update({
        data: {
          status: TransactionStatus.COMPLETED,
        },
        where: { id: transactionExists.id },
        select: {
          id: true,
          status: true,
        },
      }),
      this.prisma.wallet.update({
        data: {
          balance: +receiverWallet.balance + +transactionExists.amount,
        },
        where: { id: transactionExists.receiverWalletId },
      }),
    ]);

    return {
      message: 'Transaction completed successfully',
      data: {
        ...transaction,
        newWalletBalance: +wallet.balance,
      },
    };
  }

  async findWallet(walletId: string) {
    return await this.prisma.wallet.findUnique({
      where: {
        id: walletId,
      },
      select: {
        id: true,
        balance: true,
        currency: true,
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getTransactions(userId: string, page: number, limit: number) {
    const conditions = {
      userId,
      status: TransactionStatus.COMPLETED,
    };

    return this.prisma.transaction.findMany({
      where: conditions,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
