import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ nullable: true })
  fileName!: string;

  @Column({ type: 'jsonb', nullable: true })
  extractedData!: any;

  @Column({ type: 'jsonb', nullable: true })
  investigations!: any[];

  @Column({ type: 'jsonb', nullable: true })
  imagingReports!: any[];

  @Column({ type: 'text', nullable: true })
  otherClinicalData!: string;

  @Column({ nullable: true })
  blobName!: string;

  @CreateDateColumn()
  createdAt!: Date;
}