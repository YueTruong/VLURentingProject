import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity) private repo: Repository<UserEntity>,
  ) {}

  findByUsername(username: string) {
    return this.repo.findOne({ where: { username } });
  }

  create(user: Partial<UserEntity>) {
    return this.repo.save(user);
  }

  async findActiveStudents() {
    const students = await this.repo.find({
      where: {
        is_active: true,
        role: {
          name: In(['STUDENT', 'student']),
        },
      },
      relations: ['role', 'profile'],
      order: {
        createdAt: 'DESC',
      },
    });

    return students.map((student) => ({
      id: student.id,
      email: student.email,
      fullName: student.profile?.full_name ?? student.username ?? student.email,
      phoneNumber: student.profile?.phone_number ?? null,
      address: student.profile?.address ?? null,
    }));
  }
}
