import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { subMonths } from 'date-fns';
@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async createWallet(dto: CreateWalletDto, userId: string) {
    try {
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
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `You already have a ${dto.currency} account`,
          );
        }
      }
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
          balance: true,
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
}
