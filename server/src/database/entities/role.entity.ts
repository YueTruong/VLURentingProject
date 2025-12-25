import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

// Định nghĩa tên bảng trong database
@Entity({ name: 'roles' })
export class RoleEntity {
  // Định nghĩa cột id là khóa chính, tự động tăng
  @PrimaryGeneratedColumn()
  id: number;

  // Định nghĩa cột 'name'
  @Column({ type: 'varchar', length: 50, unique: true })
  name: string; // 'admin', 'owner', 'student'

  // Định nghĩa mối quan hệ Một-Nhiều
  // Một vai trò (Role) có thể thuộc về nhiều Người dùng (User)
  @OneToMany(() => UserEntity, (user) => user.role)
  users: UserEntity[];
}
