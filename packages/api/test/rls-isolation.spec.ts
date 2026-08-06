import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Row Level Security (RLS) Isolation Test', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    // Injected default connection which connects as non-owner app_user
    dataSource = app.get<DataSource>('default');
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('Tenant A session query under app_user RLS context returns Tenant A rows and zero rows of Tenant B', async () => {
    const tenantAId = '11111111-1111-1111-1111-111111111111';
    const tenantBId = '22222222-2222-2222-2222-222222222222';

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Execute set_config under non-owner app_user connection inside transaction
      await queryRunner.query(`SELECT set_config('app.tenant_id', $1, true)`, [tenantAId]);

      // Query sessions under Tenant A RLS context
      const sessions = await queryRunner.query(`SELECT * FROM sessions`);

      // 1. Assert Tenant A's own rows are present (no total-blackout regression)
      const tenantARows = sessions.filter((s: any) => s.tenant_id === tenantAId);
      expect(tenantARows.length).toBeGreaterThan(0);

      // 2. Assert zero rows of Tenant B exist in results (cross-tenant security)
      const tenantBRows = sessions.filter((s: any) => s.tenant_id === tenantBId);
      expect(tenantBRows.length).toBe(0);

    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  });
});
