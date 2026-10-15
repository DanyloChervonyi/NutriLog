import { Injectable } from '@nestjs/common';
import type { UserProfile } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { calculateNutritionTargets } from './nutrition-calculator.js';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    return profile ? this.toResponse(profile) : null;
  }

  async update(userId: string, input: UpdateProfileDto) {
    const targets = calculateNutritionTargets(input);
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...input,
        dailyCaloriesGoal: targets.dailyCaloriesGoal,
        proteinGoal: targets.proteinGoal,
        fatGoal: targets.fatGoal,
        carbsGoal: targets.carbsGoal,
      },
      update: {
        ...input,
        dailyCaloriesGoal: targets.dailyCaloriesGoal,
        proteinGoal: targets.proteinGoal,
        fatGoal: targets.fatGoal,
        carbsGoal: targets.carbsGoal,
      },
    });
    return { ...this.toResponse(profile), bmr: targets.bmr, tdee: targets.tdee };
  }

  private toResponse(profile: UserProfile) {
    const targets = calculateNutritionTargets({
      gender: profile.gender,
      age: profile.age,
      heightCm: Number(profile.heightCm),
      weightKg: Number(profile.weightKg),
      goal: profile.goal,
      activityLevel: profile.activityLevel,
    });
    return {
      gender: profile.gender,
      age: profile.age,
      heightCm: Number(profile.heightCm),
      weightKg: Number(profile.weightKg),
      goal: profile.goal,
      activityLevel: profile.activityLevel,
      ...targets,
    };
  }
}
