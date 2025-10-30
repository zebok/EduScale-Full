const redisConfig = require('../config/redis');
const enrollmentService = require('../services/enrollmentService');
const neo4jService = require('../services/neo4jService');


class RedisToEnrollmentWorker {
  constructor() {
    this.intervalMs = 30 * 1000; // 30 seconds (for testing)
    this.batchSize = 100; // Process 100 records at a time
    this.isRunning = false;
    this.intervalId = null;
    this.stats = {
      totalProcessed: 0,
      totalCreated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      totalNeo4jSynced: 0,
      totalNeo4jErrors: 0,
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

    console.log(`🚀 Starting Redis → Cassandra → Neo4j Worker (every ${this.intervalMs / 1000} seconds)`);
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

      // Sync successfully created enrollments to Neo4j
      await this.syncToNeo4j(prospectionBatch, results);

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
   * Sync successfully processed records to Neo4j
   */
  async syncToNeo4j(prospectionBatch, cassandraResults) {
    try {
      let syncedCount = 0;
      let errorCount = 0;

      // Only sync records that were successfully created in Cassandra
      for (const prospecto of prospectionBatch) {
        // Skip if it was an error in Cassandra
        const wasError = cassandraResults.errorDetails.find(e => e.email === prospecto.email);
        if (wasError) {
          continue;
        }

        // Validate that prospecto has DNI
        if (!prospecto.dni) {
          console.log(`⚠️  [Worker->Neo4j] Skipping ${prospecto.email}: no DNI`);
          continue;
        }

        try {
          await neo4jService.syncStudentInterest(prospecto);
          syncedCount++;
        } catch (neo4jError) {
          console.error(`❌ [Worker->Neo4j] Error syncing ${prospecto.email}:`, neo4jError.message);
          errorCount++;
        }
      }

      this.stats.totalNeo4jSynced += syncedCount;
      this.stats.totalNeo4jErrors += errorCount;

      console.log(`🔄 [Worker->Neo4j] Synced ${syncedCount} records to Neo4j (${errorCount} errors)`);

    } catch (error) {
      console.error('❌ [Worker->Neo4j] Batch sync error:', error);
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
