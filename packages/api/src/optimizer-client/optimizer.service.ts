import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import Redis from 'ioredis';

@Injectable()
export class OptimizerClientService {
  private readonly logger = new Logger(OptimizerClientService.name);
  private redisPublisher: Redis;
  private optimizerUrl: string;

  constructor() {
    this.optimizerUrl = process.env.OPTIMIZER_URL || 'http://optimizer:8000';
    this.redisPublisher = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  async allocate(requestData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.optimizerUrl}/allocate`, requestData, {
        timeout: 500, // Hard 500ms wall clock limit per PLAN.md specification
      });
      return response.data;
    } catch (err) {
      this.logger.warn(`Optimizer solver timeout (>500ms) or unreachable: ${err.message}. Triggering Tier-1 local fallback.`);

      // Trigger Tier-1 local fallback in gateway via Redis
      await this.redisPublisher.publish('optimizer:fallback', JSON.stringify({
        tier: 1,
        reason: 'Optimizer timeout / unreachable',
        timestamp: new Date().toISOString(),
      }));

      return null;
    }
  }

  async plan(requestData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.optimizerUrl}/plan`, requestData, {
        timeout: 2000,
      });
      return response.data;
    } catch (err) {
      this.logger.error(`Optimizer stage A plan error: ${err.message}`);
      return null;
    }
  }
}
