import { INestApplication } from '@nestjs/common';
import { Test as NestTest } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;
  let httpRequest: request.SuperTest<request.Test>;

  beforeAll(async () => {
    const moduleFixture = await NestTest.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpRequest = request(app.getHttpServer()) as unknown as request.SuperTest<request.Test>;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET tasks empty list)', async () => {
    const res = await httpRequest.get('/tasks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});
