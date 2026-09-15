import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // COMPANY-scope example module: any user with users.read (COMPANY scope)
  // sees the whole company, same pattern as leads but without OWN/TEAM branches.
  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, fullName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
