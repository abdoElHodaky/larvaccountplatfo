<?php

namespace App\Features\Sales\Models;

use App\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class SalesOrder extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'customer_id',
        'order_number',
        'order_date',
        'delivery_date',
        'status',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'shipping_amount',
        'total_amount',
        'currency',
        'payment_terms',
        'shipping_address',
        'billing_address',
        'notes',
        'internal_notes',
        'metadata',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'order_date' => 'date',
        'delivery_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'shipping_address' => 'array',
        'billing_address' => 'array',
        'metadata' => 'array',
        'approved_at' => 'datetime',
        'created_at' => 'datetime' => 'datetime',
        'updated_at' => 'datetime' => 'datetime',
        'deleted_at' => 'datetime' => 'datetime',
    ];

    protected $casts = [
        'order_date',
        'delivery_date',
        'approved_at',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Order statuses
     */
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_SHIPPED = 'shipped';

    public const STATUS_DELIVERED = 'delivered';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the customer that owns the sales order
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the sales order items
     */
    public function items(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    /**
     * Get the invoices generated from this order
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Scope for orders by status
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for pending orders
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for confirmed orders
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', self::STATUS_CONFIRMED);
    }

    /**
     * Scope for orders by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('order_date', [$startDate, $endDate]);
    }

    /**
     * Get formatted order number
     */
    public function getFormattedOrderNumberAttribute(): string
    {
        return $this->order_number ?: 'SO-'.str_pad($this->id, 8, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate totals from items
     */
    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum(function ($item) {
            return $item->quantity * $item->unit_price;
        });

        $this->total_amount = $this->subtotal + $this->tax_amount + $this->shipping_amount - $this->discount_amount;
        $this->save();
    }

    /**
     * Check if order can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PENDING, self::STATUS_CONFIRMED]);
    }

    /**
     * Check if order can be confirmed
     */
    public function canBeConfirmed(): bool
    {
        return $this->status === self::STATUS_PENDING && $this->items->count() > 0;
    }

    /**
     * Confirm the order
     */
    public function confirm(): bool
    {
        if (! $this->canBeConfirmed()) {
            return false;
        }

        $this->status = self::STATUS_CONFIRMED;

        return $this->save();
    }

    /**
     * Cancel the order
     */
    public function cancel(): bool
    {
        if (! $this->canBeCancelled()) {
            return false;
        }

        $this->status = self::STATUS_CANCELLED;

        return $this->save();
    }

    /**
     * Get order progress percentage
     */
    public function getProgressPercentage(): int
    {
        $statusProgress = [
            self::STATUS_DRAFT => 0,
            self::STATUS_PENDING => 10,
            self::STATUS_CONFIRMED => 25,
            self::STATUS_PROCESSING => 50,
            self::STATUS_SHIPPED => 75,
            self::STATUS_DELIVERED => 90,
            self::STATUS_COMPLETED => 100,
            self::STATUS_CANCELLED => 0,
        ];

        return $statusProgress[$this->status] ?? 0;
    }
}
