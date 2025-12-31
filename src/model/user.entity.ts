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


}