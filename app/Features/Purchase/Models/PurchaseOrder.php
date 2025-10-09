<?php

namespace App\Features\Purchase\Models;

use App\Shared\Models\HybridModel;
use App\Features\Inventory\Models\Product;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrder extends HybridModel
{
    use SoftDeletes;

    protected $fillable = [
        'organization_id',
        'supplier_id',
        'warehouse_id',
        'po_number',
        'reference_number',
        'status',
        'order_date',
        'expected_delivery_date',
        'actual_delivery_date',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'shipping_amount',
        'total_amount',
        'currency',
        'exchange_rate',
        'payment_terms',
        'notes',
        'internal_notes',
        'metadata',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_delivery_date' => 'date',
        'actual_delivery_date' => 'date',
        'approved_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'exchange_rate' => 'decimal:6',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_SENT = 'sent';
    const STATUS_RECEIVED = 'received';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('order_date', [$startDate, $endDate]);
    }

    public function getFormattedPoNumberAttribute(): string
    {
        return $this->po_number ?: 'PO-' . str_pad($this->id, 8, '0', STR_PAD_LEFT);
    }

    public function calculateTotals(): void
    {
        $this->subtotal = $this->items->sum(function ($item) {
            return $item->quantity * $item->unit_cost;
        });

        $this->total_amount = $this->subtotal + $this->tax_amount + $this->shipping_amount - $this->discount_amount;
        $this->save();
    }

    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_PENDING && $this->items->count() > 0;
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PENDING, self::STATUS_APPROVED]);
    }

    public function approve(): bool
    {
        if (!$this->canBeApproved()) {
            return false;
        }

        $this->status = self::STATUS_APPROVED;
        $this->approved_by = auth()->id();
        $this->approved_at = now();
        return $this->save();
    }

    public function markAsReceived(): bool
    {
        if ($this->status !== self::STATUS_SENT) {
            return false;
        }

        $this->status = self::STATUS_RECEIVED;
        $this->actual_delivery_date = now();
        return $this->save();
    }

    public function getProgressPercentage(): int
    {
        $statusProgress = [
            self::STATUS_DRAFT => 0,
            self::STATUS_PENDING => 15,
            self::STATUS_APPROVED => 30,
            self::STATUS_SENT => 60,
            self::STATUS_RECEIVED => 85,
            self::STATUS_COMPLETED => 100,
            self::STATUS_CANCELLED => 0,
        ];

        return $statusProgress[$this->status] ?? 0;
    }
}
