import { Repository } from 'typeorm';

/**
 * Create a mock TypeORM repository
 */
export const createMockRepository = <T>(): any => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    execute: jest.fn(),
  })),
});

/**
 * Create a mock config service
 */
export const createMockConfigService = (config: Record<string, any> = {}) => ({
  get: jest.fn((key: string) => config[key]),
  getOrThrow: jest.fn((key: string) => {
    if (config[key] === undefined) {
      throw new Error(`Config key ${key} not found`);
    }
    return config[key];
  }),
});

/**
 * Create a mock logger
 */
export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

/**
 * Create a mock HTTP service (for external API calls)
 */
export const createMockHttpService = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  axiosRef: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
});

/**
 * Create a mock queue
 */
export const createMockQueue = () => ({
  add: jest.fn(),
  process: jest.fn(),
  on: jest.fn(),
  getJob: jest.fn(),
  getJobs: jest.fn(),
  clean: jest.fn(),
  close: jest.fn(),
});

/**
 * Create a mock Redis client
 */
export const createMockRedisClient = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn(),
});

/**
 * Create a mock S3 client
 */
export const createMockS3Client = () => ({
  send: jest.fn(),
  destroy: jest.fn(),
});

/**
 * Create a mock Stripe client
 */
export const createMockStripeClient = () => ({
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    del: jest.fn(),
  },
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    confirm: jest.fn(),
    cancel: jest.fn(),
  },
  charges: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  refunds: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  accounts: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
  },
  transfers: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
});
