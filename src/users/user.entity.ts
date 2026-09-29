import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({
    length: 50,
    unique: true,
  })
  username!: string;

  @Column({
    select: false,
  })
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;
}