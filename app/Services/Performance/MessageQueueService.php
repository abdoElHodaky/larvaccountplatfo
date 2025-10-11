<?php

namespace App\Services\Performance;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

/**
 * Message Queue Optimization Service
 * Provides high-performance message queuing with Redis pub/sub,
 * message batching, priority queuing, and compression
 */
class MessageQueueService
{
    private const QUEUE_PREFIX = 'mq:';

    private const BATCH_SIZE = 100;

    private const COMPRESSION_THRESHOLD = 1024; // 1KB

    private const MAX_RETRY_ATTEMPTS = 3;

    private const PRIORITY_LEVELS = ['high', 'normal', 'low'];

    private $redis;

    private $compressionEnabled;

    private $batchingEnabled;

    public function __construct(bool $compressionEnabled = true, bool $batchingEnabled = true)
    {
        $this->redis = Redis::connection();
        $this->compressionEnabled = $compressionEnabled;
        $this->batchingEnabled = $batchingEnabled;
    }

    /**
     * Publish message with priority and compression
     */
    public function publish(
        string $channel,
        array $message,
        string $priority = 'normal',
        bool $persistent = false
    ): bool {
        try {
            $messageData = [
                'id' => $this->generateMessageId(),
                'timestamp' => microtime(true),
                'priority' => $priority,
                'payload' => $message,
                'persistent' => $persistent,
                'retry_count' => 0,
            ];

            $serialized = json_encode($messageData);

            // Compress large messages
            if ($this->compressionEnabled && strlen($serialized) > self::COMPRESSION_THRESHOLD) {
                $compressed = gzcompress($serialized, 6);
                if ($compressed !== false && strlen($compressed) < strlen($serialized)) {
                    $serialized = base64_encode($compressed);
                    $messageData['compressed'] = true;
                }
            }

            // Use priority queues for better message ordering
            $queueKey = $this->getQueueKey($channel, $priority);

            if ($this->batchingEnabled) {
                // Add to batch queue
                $this->addToBatch($queueKey, $serialized);
            } else {
                // Publish immediately
                $this->redis->lpush($queueKey, $serialized);
                $this->redis->publish($channel, $serialized);
            }

            // Store persistent messages
            if ($persistent) {
                $this->storePersistentMessage($messageData);
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to publish message', [
                'channel' => $channel,
                'error' => $e->getMessage(),
                'message' => $message,
            ]);

            return false;
        }
    }

    /**
     * Subscribe to channel with message filtering
     */
    public function subscribe(
        array $channels,
        callable $callback,
        array $filters = []
    ): void {
        try {
            $this->redis->subscribe($channels, function ($message, $channel) use ($callback, $filters) {
                $decodedMessage = $this->decodeMessage($message);

                if ($decodedMessage && $this->passesFilters($decodedMessage, $filters)) {
                    $callback($decodedMessage, $channel);
                }
            });
        } catch (\Exception $e) {
            Log::error('Subscription error', [
                'channels' => $channels,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Process message batches for improved throughput
     */
    public function processBatches(): void
    {
        foreach (self::PRIORITY_LEVELS as $priority) {
            $this->processPriorityBatch($priority);
        }
    }

    /**
     * Get queue statistics
     */
    public function getQueueStats(): array
    {
        $stats = [
            'total_queues' => 0,
            'total_messages' => 0,
            'priority_breakdown' => [],
            'average_message_size' => 0,
            'compression_ratio' => 0,
        ];

        $pattern = self::QUEUE_PREFIX.'*';
        $keys = $this->redis->keys($pattern);

        foreach ($keys as $key) {
            $length = $this->redis->llen($key);
            $stats['total_messages'] += $length;
            $stats['total_queues']++;

            // Extract priority from key
            $priority = $this->extractPriorityFromKey($key);
            if (! isset($stats['priority_breakdown'][$priority])) {
                $stats['priority_breakdown'][$priority] = 0;
            }
            $stats['priority_breakdown'][$priority] += $length;
        }

        // Get compression stats from cache
        $stats['compression_ratio'] = Cache::get('mq:compression_ratio', 0);
        $stats['average_message_size'] = Cache::get('mq:avg_message_size', 0);

        return $stats;
    }

    /**
     * Optimize queue performance
     */
    public function optimizeQueues(): void
    {
        // Clean up empty queues
        $this->cleanupEmptyQueues();

        // Rebalance priority queues
        $this->rebalancePriorityQueues();

        // Update performance metrics
        $this->updatePerformanceMetrics();
    }

    /**
     * Implement message deduplication
     */
    public function deduplicateMessages(string $channel, int $windowSeconds = 300): int
    {
        $dedupeKey = "dedupe:{$channel}";
        $currentTime = time();
        $windowStart = $currentTime - $windowSeconds;

        // Remove old entries
        $this->redis->zremrangebyscore($dedupeKey, 0, $windowStart);

        // Get queue messages
        $queueKey = $this->getQueueKey($channel, 'normal');
        $messages = $this->redis->lrange($queueKey, 0, -1);

        $duplicatesRemoved = 0;
        $uniqueMessages = [];

        foreach ($messages as $message) {
            $decoded = $this->decodeMessage($message);
            if (! $decoded) {
                continue;
            }

            $messageHash = md5(json_encode($decoded['payload']));

            // Check if message exists in deduplication window
            if (! $this->redis->zscore($dedupeKey, $messageHash)) {
                $uniqueMessages[] = $message;
                $this->redis->zadd($dedupeKey, $currentTime, $messageHash);
            } else {
                $duplicatesRemoved++;
            }
        }

        // Replace queue with deduplicated messages
        if ($duplicatesRemoved > 0) {
            $this->redis->del($queueKey);
            if (! empty($uniqueMessages)) {
                $this->redis->lpush($queueKey, ...$uniqueMessages);
            }
        }

        // Set expiration on deduplication key
        $this->redis->expire($dedupeKey, $windowSeconds);

        return $duplicatesRemoved;
    }

    /**
     * Implement circuit breaker pattern for failed messages
     */
    public function handleFailedMessage(array $messageData, string $error): void
    {
        $messageData['retry_count'] = ($messageData['retry_count'] ?? 0) + 1;
        $messageData['last_error'] = $error;
        $messageData['failed_at'] = microtime(true);

        if ($messageData['retry_count'] <= self::MAX_RETRY_ATTEMPTS) {
            // Exponential backoff
            $delay = pow(2, $messageData['retry_count']) * 1000; // milliseconds

            $this->scheduleRetry($messageData, $delay);
        } else {
            // Move to dead letter queue
            $this->moveToDeadLetterQueue($messageData);
        }
    }

    /**
     * Private helper methods
     */
    private function generateMessageId(): string
    {
        return uniqid('msg_', true).'_'.bin2hex(random_bytes(4));
    }

    private function getQueueKey(string $channel, string $priority): string
    {
        return self::QUEUE_PREFIX."{$channel}:{$priority}";
    }

    private function addToBatch(string $queueKey, string $message): void
    {
        $batchKey = "batch:{$queueKey}";
        $this->redis->lpush($batchKey, $message);

        // Process batch if it reaches the threshold
        if ($this->redis->llen($batchKey) >= self::BATCH_SIZE) {
            $this->processBatch($batchKey, $queueKey);
        }
    }

    private function processBatch(string $batchKey, string $queueKey): void
    {
        $messages = $this->redis->lrange($batchKey, 0, self::BATCH_SIZE - 1);

        if (! empty($messages)) {
            // Move messages to main queue
            $this->redis->lpush($queueKey, ...$messages);

            // Remove processed messages from batch
            $this->redis->ltrim($batchKey, count($messages), -1);

            // Publish batch notification
            $channel = $this->extractChannelFromQueueKey($queueKey);
            $this->redis->publish($channel, json_encode([
                'type' => 'batch_processed',
                'count' => count($messages),
                'timestamp' => microtime(true),
            ]));
        }
    }

    private function processPriorityBatch(string $priority): void
    {
        $pattern = self::QUEUE_PREFIX."*:{$priority}";
        $keys = $this->redis->keys($pattern);

        foreach ($keys as $key) {
            $batchKey = "batch:{$key}";
            if ($this->redis->exists($batchKey)) {
                $this->processBatch($batchKey, $key);
            }
        }
    }

    private function decodeMessage(string $message): ?array
    {
        try {
            $decoded = json_decode($message, true);

            // Handle compressed messages
            if (isset($decoded['compressed']) && $decoded['compressed']) {
                $decompressed = gzuncompress(base64_decode($decoded['payload']));
                if ($decompressed !== false) {
                    $decoded = json_decode($decompressed, true);
                }
            }

            return $decoded;
        } catch (\Exception $e) {
            Log::warning('Failed to decode message', ['error' => $e->getMessage()]);

            return null;
        }
    }

    private function passesFilters(array $message, array $filters): bool
    {
        foreach ($filters as $key => $value) {
            if (! isset($message[$key]) || $message[$key] !== $value) {
                return false;
            }
        }

        return true;
    }

    private function storePersistentMessage(array $messageData): void
    {
        $key = "persistent:msg:{$messageData['id']}";
        $this->redis->setex($key, 86400, json_encode($messageData)); // 24 hours
    }

    private function scheduleRetry(array $messageData, int $delayMs): void
    {
        $retryTime = microtime(true) + ($delayMs / 1000);
        $this->redis->zadd('retry_queue', $retryTime, json_encode($messageData));
    }

    private function moveToDeadLetterQueue(array $messageData): void
    {
        $this->redis->lpush('dead_letter_queue', json_encode($messageData));
        Log::error('Message moved to dead letter queue', ['message_id' => $messageData['id']]);
    }

    private function cleanupEmptyQueues(): void
    {
        $pattern = self::QUEUE_PREFIX.'*';
        $keys = $this->redis->keys($pattern);

        foreach ($keys as $key) {
            if ($this->redis->llen($key) === 0) {
                $this->redis->del($key);
            }
        }
    }

    private function rebalancePriorityQueues(): void
    {
        // Implementation would depend on specific requirements
        // This is a placeholder for queue rebalancing logic
    }

    private function updatePerformanceMetrics(): void
    {
        $stats = $this->getQueueStats();

        Cache::put('mq:last_optimization', time(), 3600);
        Cache::put('mq:queue_stats', $stats, 300);
    }

    private function extractPriorityFromKey(string $key): string
    {
        $parts = explode(':', $key);

        return end($parts);
    }

    private function extractChannelFromQueueKey(string $queueKey): string
    {
        $parts = explode(':', $queueKey);
        array_shift($parts); // Remove prefix
        array_pop($parts);   // Remove priority

        return implode(':', $parts);
    }
}
