import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

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
}
