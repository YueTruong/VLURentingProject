import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../database/entities/user.entity";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private repo: Repository<UserEntity>) {}

  findByUsername(username: string) {
    return this.repo.findOne({ where: { username } });
  }

  create(user: Partial<UserEntity> ) {
    return this.repo.save(user);
  }
}