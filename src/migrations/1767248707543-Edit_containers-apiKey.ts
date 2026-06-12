import { MigrationInterface, QueryRunner } from "typeorm";

export class EditContainersApiKey1767248707543 implements MigrationInterface {
    name = 'EditContainersApiKey1767248707543'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "containers" ADD "apiKey" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "containers" ADD CONSTRAINT "UQ_3159cdd5f47e121d8fa34bcff33" UNIQUE ("apiKey")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "containers" DROP CONSTRAINT "UQ_3159cdd5f47e121d8fa34bcff33"`);
        await queryRunner.query(`ALTER TABLE "containers" DROP COLUMN "apiKey"`);
    }

}
