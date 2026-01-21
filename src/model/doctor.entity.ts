import { Column, Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./user.entity";

@Entity()
export class Doctors {
    @PrimaryGeneratedColumn({
        type: 'bigint',
        name: 'id'
    })
    id: number;

    @OneToOne(() => Users)
    @JoinColumn({ name: 'user_id' })
    user: Users;


    @Column({
        name: 'license_number',
        nullable: false
    })
    licenseNumber: string;

    @Column({
        name: 'experience_years',
        type: 'int',
        default: 0
    })
    experienceYears: number;

    @Column({
        name: 'consultation_fee',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0
    })
    consultationFee: number;

    @Column({
        type: 'text',
        nullable: true
    })
    bio: string;

    @Column({
        name: 'clinic_address',
        nullable: true
    })
    clinicAddress: string;

    @Column({
        type: 'float',
        default: 0
    })
    rating: number;

    @Column({
        name: 'is_available',
        type: 'boolean',
        default: true
    })
    isAvailable: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}