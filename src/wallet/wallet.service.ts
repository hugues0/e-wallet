import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { subMonths, subDays } from 'date-fns';
import { TransactionStatus } from '@prisma/client';
import { Response } from 'express';

import { GeneratePdfService } from 'src/helpers/generate-pdf/generate-pdf.service';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private pdfService: GeneratePdfService,
  ) {}

  async createWallet(dto: CreateWalletDto, userId: string) {
    try {
      const existingWallet = await this.prisma.wallet.findFirst({
        where: {
          userId,
          currency: dto.currency,
        },
      });

      if (existingWallet)
        throw new ConflictException(
          `You already have a ${dto.currency} account`,
        );
      const wallet = await this.prisma.wallet.create({
        data: {
          ...dto,
          userId,
        },
        select: {
          id: true,
          currency: true,
          balance: true,
        },
      });
      return {
        message: 'You have successfully created a wallet',
        data: { wallet },
      };
    } catch (error) {
      throw error;
    }
  }

  async findUserWallets(userId: string) {
    try {
      const wallets = await this.prisma.wallet.findMany({
        where: { userId },
        select: {
          id: true,
          balance: true,
          currency: true,
        },
      });
      return { message: 'Wallets successfully retrived', data: wallets };
    } catch (error) {
      throw error;
    }
  }

  async findWalletById(walletId: string) {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { id: walletId },
        select: {
          id: true,
          currency: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      if (!wallet) {
        throw new NotFoundException(`Wallet with id ${walletId} not found`);
      }
      return { message: 'Wallet successfully retrieved', data: wallet };
    } catch (error) {
      throw error;
    }
  }

  async getSentTransactions(
    userId: string,
    walletId: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId, userId },
      include: {
        sentTransactions: {
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException(
        'Wallet not found or does not belong to user',
      );
    }

    const totalTransactions = await this.prisma.transaction.count({
      where: {
        senderWalletId: walletId,
        userId: userId,
      },
    });

    return {
      data: wallet.sentTransactions,
      total: totalTransactions,
      page,
      limit,
      totalPages: Math.ceil(totalTransactions / limit),
    };
  }

  async getIncomingTransactions(
    userId: string,
    walletId: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId, userId },
      include: {
        receivedTransactions: {
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException(
        'Wallet not found or does not belong to user',
      );
    }

    const totalTransactions = await this.prisma.transaction.count({
      where: {
        receiverWalletId: walletId,
        userId: userId,
      },
    });

    return {
      data: wallet.receivedTransactions,
      total: totalTransactions,
      page,
      limit,
      totalPages: Math.ceil(totalTransactions / limit),
    };
  }

  async getTopSentWallets(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException(
        'Wallet not found or does not belong to user',
      );
    }

    const threeMonthsAgo = subMonths(new Date(), 3);
    const topWallets = await this.prisma.transaction.groupBy({
      by: ['receiverWalletId'],
      _count: {
        receiverWalletId: true,
      },
      where: {
        senderWalletId: walletId,
        createdAt: {
          gte: threeMonthsAgo,
        },
      },
      orderBy: {
        _count: {
          receiverWalletId: 'desc',
        },
      },
      take: 3,
    });

    const walletDetails = await Promise.all(
      topWallets.map(async (wallet) => {
        const walletInfo = await this.prisma.wallet.findUnique({
          where: { id: wallet.receiverWalletId },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });

        return {
          walletId: wallet.receiverWalletId,
          firstName: walletInfo.user.firstName,
          lastName: walletInfo.user.lastName,
          email: walletInfo.user.email,
        };
      }),
    );

    return walletDetails;
  }

  async generateMonthlyReport(userId: string, walletId: string, res: Response) {
    const wallet = await this.prisma.wallet.findUnique({
      where: {
        id: walletId,
        userId,
      },
      include: {
        user: true,
      },
    });

    if (!wallet)
      throw new NotFoundException(
        `Wallet with provided ID ${walletId} could not be founf`,
      );

    const thirtyDaysAgo = subDays(new Date(), 30);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        AND: [
          {
            OR: [{ senderWalletId: walletId }, { receiverWalletId: walletId }],
          },
          {
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
          {
            status: TransactionStatus.COMPLETED, // Include only completed transactions
          },
        ],
      },
      include: {
        senderWallet: true,
        receiverWallet: true,
      },
    });

    const pdfBuffer = await this.pdfService.generateStatement(
      transactions,
      wallet,
    );

    if (!pdfBuffer || !pdfBuffer.length) {
      throw new InternalServerErrorException('unable to generate PDF');
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=wallet_statement_${wallet.id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
