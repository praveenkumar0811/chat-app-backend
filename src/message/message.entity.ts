import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  senderId!: string;

  @Column({ type: 'uuid' })
  receiverId!: string;

  @Column({ type: 'text' })
  encryptedContent!: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  seenAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}