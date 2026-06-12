import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1767126770187 implements MigrationInterface {
    name = 'InitialSchema1767126770187'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "cargos" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text, "type" character varying NOT NULL, "temperatureMin" numeric(5,2) NOT NULL, "temperatureMax" numeric(5,2) NOT NULL, "humidityMin" numeric(5,2) NOT NULL, "humidityMax" numeric(5,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_052f813788106484e4ef7cd1745" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "telemetry_records" ("id" SERIAL NOT NULL, "temperature" numeric(5,2) NOT NULL, "humidity" numeric(5,2) NOT NULL, "latitude" numeric(10,7), "longitude" numeric(10,7), "batteryLevel" numeric(5,2), "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "containerId" integer NOT NULL, CONSTRAINT "PK_eda962efe16588c3a58c0ae42f5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "containers" ("id" SERIAL NOT NULL, "serialNumber" character varying NOT NULL, "name" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'available', "lastTemperature" numeric(5,2), "lastHumidity" numeric(5,2), "lastLocationLat" numeric(10,7), "lastLocationLng" numeric(10,7), "lastUpdatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_da2a09a459bc1126ec7456cc2db" UNIQUE ("serialNumber"), CONSTRAINT "PK_21cbac3e68f7b1cf53d39cda70c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "incidents" ("id" SERIAL NOT NULL, "type" character varying NOT NULL, "severity" character varying NOT NULL, "description" text NOT NULL, "resolvedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "shipmentId" integer NOT NULL, CONSTRAINT "PK_ccb34c01719889017e2246469f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "shipments" ("id" SERIAL NOT NULL, "status" character varying NOT NULL DEFAULT 'planned', "startDate" TIMESTAMP, "endDate" TIMESTAMP, "origin" character varying NOT NULL, "destination" character varying NOT NULL, "notes" text, "cargoId" integer NOT NULL, "containerId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_6deda4532ac542a93eab214b564" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "event_logs" ("id" SERIAL NOT NULL, "action" character varying NOT NULL, "entityType" character varying NOT NULL, "entityId" integer NOT NULL, "details" jsonb, "userId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b09cf1bb58150797d898076b242" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'observer', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "telemetry_records" ADD CONSTRAINT "FK_0c843a25f50fddcc9d67f782926" FOREIGN KEY ("containerId") REFERENCES "containers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incidents" ADD CONSTRAINT "FK_f4358e4c470038918a4188ad997" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_1c3168600fbd193e88242b76dac" FOREIGN KEY ("cargoId") REFERENCES "cargos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_7eec53edba05a176c0ee57408a8" FOREIGN KEY ("containerId") REFERENCES "containers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shipments" ADD CONSTRAINT "FK_2685a15375aec334a1716dc16bb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_logs" ADD CONSTRAINT "FK_0fe5d8efa1b0b698b40f78b6998" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_logs" DROP CONSTRAINT "FK_0fe5d8efa1b0b698b40f78b6998"`);
        await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_2685a15375aec334a1716dc16bb"`);
        await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_7eec53edba05a176c0ee57408a8"`);
        await queryRunner.query(`ALTER TABLE "shipments" DROP CONSTRAINT "FK_1c3168600fbd193e88242b76dac"`);
        await queryRunner.query(`ALTER TABLE "incidents" DROP CONSTRAINT "FK_f4358e4c470038918a4188ad997"`);
        await queryRunner.query(`ALTER TABLE "telemetry_records" DROP CONSTRAINT "FK_0c843a25f50fddcc9d67f782926"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "event_logs"`);
        await queryRunner.query(`DROP TABLE "shipments"`);
        await queryRunner.query(`DROP TABLE "incidents"`);
        await queryRunner.query(`DROP TABLE "containers"`);
        await queryRunner.query(`DROP TABLE "telemetry_records"`);
        await queryRunner.query(`DROP TABLE "cargos"`);
    }

}
