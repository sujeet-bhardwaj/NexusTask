import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../db/prisma';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedUser } from '../middleware/auth';

export class AuthService {
  static generateToken(user: { id: string; name: string; email: string; role: Role; title: string }): string {
    return jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        avatar: user.avatar,
      },
    };
  }

  static async register(data: { name: string; email: string; password: string; role: Role; title: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError('Email is already in use', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: data.role,
        title: data.title,
      },
    });

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
      },
    };
  }

  /**
   * Fast demo login switch by user id (great for testing assignment reviewer personas!)
   */
  static async switchDemoUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new AppError('User not found', 404);

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        avatar: user.avatar,
      },
    };
  }

  static async listAllUsers() {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        title: true,
        avatar: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
  }
}
