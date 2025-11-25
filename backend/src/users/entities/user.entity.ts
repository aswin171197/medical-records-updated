import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  mobile!: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: Date;

  @Column({ nullable: true })
  resetOtp!: string;

  @Column({ nullable: true })
  resetOtpExpiry!: Date;

  @Column({ nullable: true })
  loginOtp!: string;

  @Column({ nullable: true })
  loginOtpExpiry!: Date;
}
