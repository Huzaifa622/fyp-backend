import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Users {
    @PrimaryGeneratedColumn({
        type: 'bigint',
        name: 'id'
    })
    id: number;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: false,
        default: ''
    })
    email: string;

    @Column({
        nullable: false,
        default: ''
    })
    password: string;
    @Column({
        nullable: false,
        default: ''
    })
    firstName: string;
    @Column({
        nullable: false,
        default: ''
    })
    lastName: string;

    @Column({ type: 'boolean', default: false })
    isEmailVerified: boolean;

    @Column({ type: 'varchar', length: 128, nullable: true, default: null })
    verificationTokenHash?: string | null;

    @Column({ type: 'timestamp', nullable: true, default: null })
    verificationTokenExpires?: Date | null;

}