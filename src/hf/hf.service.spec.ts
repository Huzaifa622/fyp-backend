import { Test, TestingModule } from '@nestjs/testing';
import { HfService } from './hf.service';

describe('HfService', () => {
  let service: HfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HfService],
    }).compile();

    service = module.get<HfService>(HfService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
