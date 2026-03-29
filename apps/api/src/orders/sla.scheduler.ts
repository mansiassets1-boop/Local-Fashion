import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class SlaScheduler implements OnModuleInit {
  private readonly logger = new Logger(SlaScheduler.name);

  constructor(
    @InjectQueue('sla-enforcement') private readonly slaQueue: Queue,
  ) {}

  onModuleInit() {
    this.startSlaChecker();
  }

  private async startSlaChecker() {
    // Remove any existing repeatable jobs
    const repeatableJobs = await this.slaQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await this.slaQueue.removeRepeatableByKey(job.key);
    }

    // Schedule SLA check every 2 minutes
    await this.slaQueue.add(
      'check-sla',
      {},
      {
        repeat: { cron: '*/2 * * * *' },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log('SLA enforcement scheduler started (every 2 minutes)');
  }
}
