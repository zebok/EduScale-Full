const redisConfig = require('../config/redis');
const enrollmentService = require('../services/enrollmentService');


class RedisToEnrollmentWorker {
  constructor() {
    this.intervalMs = 15 * 60 * 1000; // 15 minutes
    this.batchSize = 100; // Process 100 records at a time
    this.isRunning = false;
    this.intervalId = null;
    this.stats = {
      totalProcessed: 0,
      totalCreated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      lastRunTime: null,
      lastRunDuration: 0
    };
  }

  /**
   * Start the worker
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Worker already running');
      return;
    }

    console.log(`🚀 Starting Redis → Cassandra Worker (every ${this.intervalMs / 1000 / 60} minutes)`);
    this.isRunning = true;

    // Run immediately on start
    this.processRedisData();

    // Then run every 15 minutes
    this.intervalId = setInterval(() => {
      this.processRedisData();
    }, this.intervalMs);
  }

  /**
   * Stop the worker
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Redis → Cassandra Worker stopped');
  }

  /**
   * Get Redis keys pattern for prospection data
   */
  getProspectionPattern() {
    return 'prospection:*';
  }

  /**
   * Main processing function
   */
  async processRedisData() {
    const startTime = Date.now();
    console.log('\n⏰ [Worker] Starting Redis → Cassandra migration...');

    try {
      // Get all prospection keys from Redis
      const redisClient = redisConfig.redisClient;
      const keys = await redisClient.keys(this.getProspectionPattern());

      if (keys.length === 0) {
        console.log('✓ [Worker] No prospection data to process');
        this.stats.lastRunTime = new Date();
        this.stats.lastRunDuration = Date.now() - startTime;
        return;
      }

      console.log(`📊 [Worker] Found ${keys.length} prospection records in Redis`);

      // Process in batches
      const batches = this.createBatches(keys, this.batchSize);
      let batchNumber = 1;

      for (const batch of batches) {
        console.log(`\n🔄 [Worker] Processing batch ${batchNumber}/${batches.length} (${batch.length} records)`);
        await this.processBatch(batch);
        batchNumber++;
      }

      // Update stats
      const duration = Date.now() - startTime;
      this.stats.lastRunTime = new Date();
      this.stats.lastRunDuration = duration;

      console.log('\n✅ [Worker] Migration completed');
      console.log(`📈 [Worker] Stats: ${this.stats.totalCreated} created, ${this.stats.totalSkipped} skipped, ${this.stats.totalErrors} errors`);
      console.log(`⏱️  [Worker] Duration: ${(duration / 1000).toFixed(2)}s`);

    } catch (error) {
      console.error('❌ [Worker] Error during migration:', error);
    }
  }

  /**
   * Process a batch of Redis keys
   */
  async processBatch(keys) {
    try {
      const redisClient = redisConfig.redisClient;

      // Get all values for this batch
      const prospectionBatch = [];

      for (const key of keys) {
        const data = await redisClient.get(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            prospectionBatch.push(parsed);
          } catch (parseError) {
            console.error(`⚠️  [Worker] Failed to parse data for key ${key}`);
          }
        }
      }

      if (prospectionBatch.length === 0) {
        return;
      }

      // Batch create enrollments in Cassandra
      const results = await enrollmentService.batchCreateEnrollments(prospectionBatch);

      // Update global stats
      this.stats.totalProcessed += results.total;
      this.stats.totalCreated += results.created;
      this.stats.totalSkipped += results.skipped;
      this.stats.totalErrors += results.errors;

      // Clean up Redis keys for successfully processed records
      const keysToDelete = [];
      for (let i = 0; i < prospectionBatch.length; i++) {
        // Delete all except errors (we'll retry errors on next run)
        if (!results.errorDetails.find(e => e.email === prospectionBatch[i].email)) {
          keysToDelete.push(keys[i]);
        }
      }

      if (keysToDelete.length > 0) {
        await redisClient.del(keysToDelete);
        console.log(`🗑️  [Worker] Cleaned ${keysToDelete.length} records from Redis`);
      }

      console.log(`✓ [Worker] Batch processed: ${results.created} created, ${results.skipped} skipped, ${results.errors} errors`);

    } catch (error) {
      console.error('❌ [Worker] Error processing batch:', error);
    }
  }

  /**
   * Split array into batches
   */
  createBatches(array, size) {
    const batches = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMs / 1000 / 60,
      batchSize: this.batchSize
    };
  }

  /**
   * Manual trigger (for testing or admin panel)
   */
  async triggerManually() {
    console.log('🔧 [Worker] Manual trigger requested');
    await this.processRedisData();
  }
}

// Export singleton instance
module.exports = new RedisToEnrollmentWorker();
