import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenProductionSchema1763300000000
  implements MigrationInterface
{
  name = 'HardenProductionSchema1763300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.posts
      ADD COLUMN IF NOT EXISTS campus varchar(3);
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.posts
      ADD COLUMN IF NOT EXISTS availability varchar(16) NOT NULL DEFAULT 'available';
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.posts
      ADD COLUMN IF NOT EXISTS video_url text;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.user_settings
      ADD COLUMN IF NOT EXISTS identity_verification_status varchar(30) NOT NULL DEFAULT 'unverified';
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.user_settings
      ADD COLUMN IF NOT EXISTS identity_document_type varchar(50);
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.user_settings
      ADD COLUMN IF NOT EXISTS identity_front_image_name varchar(255);
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.user_settings
      ADD COLUMN IF NOT EXISTS identity_back_image_name varchar(255);
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.user_settings
      ADD COLUMN IF NOT EXISTS identity_submitted_at timestamp;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.user_settings
      ADD COLUMN IF NOT EXISTS identity_verified_at timestamp;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.user_settings
      DROP COLUMN IF EXISTS identity_verified_at;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.user_settings
      DROP COLUMN IF EXISTS identity_submitted_at;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.user_settings
      DROP COLUMN IF EXISTS identity_back_image_name;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.user_settings
      DROP COLUMN IF EXISTS identity_front_image_name;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.user_settings
      DROP COLUMN IF EXISTS identity_document_type;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.user_settings
      DROP COLUMN IF EXISTS identity_verification_status;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.posts
      DROP COLUMN IF EXISTS video_url;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.posts
      DROP COLUMN IF EXISTS availability;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS public.posts
      DROP COLUMN IF EXISTS campus;
    `);
  }
}
