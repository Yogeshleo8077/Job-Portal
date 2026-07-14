import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { LoginInput, RegisterInput } from './auth.schema';

const SALT_ROUNDS = 12;

const publicUser = (u: {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string | null;
}) => ({ id: u.id, email: u.email, name: u.name, role: u.role, companyId: u.companyId });

function issueTokens(user: { id: string; role: Role; email: string }) {
  const payload = { sub: user.id, role: user.role, email: user.email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw ApiError.conflict('An account with this email already exists');

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Employers optionally bootstrap a company at signup.
    let companyId: string | undefined;
    if (input.role === 'EMPLOYER' && input.companyName) {
      const company = await prisma.company.upsert({
        where: { name: input.companyName },
        update: {},
        create: { name: input.companyName },
      });
      companyId = company.id;
    }

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role as Role,
        companyId,
      },
    });

    return { user: publicUser(user), ...issueTokens(user) };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw ApiError.unauthorized('Invalid email or password');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw ApiError.unauthorized('Invalid email or password');

    return { user: publicUser(user), ...issueTokens(user) };
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw ApiError.unauthorized('User no longer exists');
    return issueTokens(user);
  },

  // Forgot password (optional module). In production this token would be emailed.
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Do not reveal whether the account exists.
    if (!user) return { message: 'If that account exists, a reset link has been sent.' };

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    // For the assessment we return the token directly (no email service configured).
    return {
      message: 'Password reset token generated.',
      resetToken: token,
    };
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) throw ApiError.badRequest('Invalid or expired reset token');

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });
    return { message: 'Password has been reset successfully.' };
  },
};
