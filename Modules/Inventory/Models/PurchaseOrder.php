<?php

namespace Modules\Inventory\Models;

use Modules\Shared\Models\HybridModel;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_delivery_date' => 'date',
        'actual_delivery_date' => 'date',
        'approved_at' => 'datetime',
        'subtotal' => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'discount_amount' => 'decimal:4',
        'shipping_amount' => 'decimal:4',
        'total_amount' => 'decimal:4',
        'exchange_rate' => 'decimal:6',
    ];

    protected $dates = [
        'order_date',
        'expected_delivery_date',
        'actual_delivery_date',
        'approved_at',
        'deleted_at',
    ];

    /**
     * Purchase order statuses
     */
    const STATUS_DRAFT = 'draft';
    const STATUS_PENDING_APPROVAL = 'pending_approval';
    const STATUS_APPROVED = 'approved';
    const STATUS_SENT = 'sent';
    const STATUS_PARTIALLY_RECEIVED = 'partially_received';
    const STATUS_RECEIVED = 'received';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the organization this purchase order belongs to
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\Organization::class);
    }

    /**
     * Get the supplier
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the warehouse
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Get the user who created this purchase order
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\User::class, 'created_by');
    }

    /**
     * Get the user who approved this purchase order
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(\Modules\Shared\Models\User::class, 'approved_by');
    }

    /**
     * Get purchase order items
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /**
     * Get purchase order receipts
     */
    public function receipts(): HasMany
    {
        return $this->hasMany(PurchaseOrderReceipt::class);
    }

    /**
     * Scope for draft orders
     */
    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    /**
     * Scope for pending approval orders
     */
    public function scopePendingApproval($query)
    {
        return $query->where('status', self::STATUS_PENDING_APPROVAL);
    }

    /**
     * Scope for approved orders
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * Scope for overdue orders
     */
    public function scopeOverdue($query)
    {
        return $query->where('expected_delivery_date', '<', now())
                    ->whereIn('status', [
                        self::STATUS_APPROVED,
                        self::STATUS_SENT,
                        self::STATUS_PARTIALLY_RECEIVED,
                    ]);
    }

    /**
     * Check if order can be edited
     */
    public function canBeEdited(): bool
    {
        return in_array($this->status, [
            self::STATUS_DRAFT,
            self::STATUS_PENDING_APPROVAL,
        ]);
    }

    /**
     * Check if order can be approved
     */
    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_PENDING_APPROVAL;
    }

    /**
     * Check if order can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return !in_array($this->status, [
            self::STATUS_COMPLETED,
            self::STATUS_CANCELLED,
        ]);
    }

    /**
     * Check if order is overdue
     */
    public function isOverdue(): bool
    {
        return $this->expected_delivery_date < now() &&
               in_array($this->status, [
                   self::STATUS_APPROVED,
                   self::STATUS_SENT,
                   self::STATUS_PARTIALLY_RECEIVED,
               ]);
    }

    /**
     * Get status display name
     */
    public function getStatusDisplayAttribute(): string
    {
        $statuses = [
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_PENDING_APPROVAL => 'Pending Approval',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_SENT => 'Sent',
            self::STATUS_PARTIALLY_RECEIVED => 'Partially Received',
            self::STATUS_RECEIVED => 'Received',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
        ];

        return $statuses[$this->status] ?? $this->status;
    }

    /**
     * Get status color
     */
    public function getStatusColorAttribute(): string
    {
        $colors = [
            self::STATUS_DRAFT => 'gray',
            self::STATUS_PENDING_APPROVAL => 'yellow',
            self::STATUS_APPROVED => 'blue',
            self::STATUS_SENT => 'purple',
            self::STATUS_PARTIALLY_RECEIVED => 'orange',
            self::STATUS_RECEIVED => 'green',
            self::STATUS_COMPLETED => 'green',
            self::STATUS_CANCELLED => 'red',
        ];

        return $colors[$this->status] ?? 'gray';
    }

    /**
     * Get received percentage
     */
    public function getReceivedPercentageAttribute(): float
    {
        $totalOrdered = $this->items()->sum('quantity');
        $totalReceived = $this->items()->sum('received_quantity');

        return $totalOrdered > 0 ? ($totalReceived / $totalOrdered) * 100 : 0;
    }

    /**
     * Get days until delivery
     */
    public function getDaysUntilDeliveryAttribute(): int
    {
        return now()->diffInDays($this->expected_delivery_date, false);
    }

    /**
     * Approve the purchase order
     */
    public function approve(\Modules\Shared\Models\User $user): bool
    {
        if (!$this->canBeApproved()) {
            return false;
        }

        $this->status = self::STATUS_APPROVED;
        $this->approved_by = $user->id;
        $this->approved_at = now();
        $this->save();

        // Create accounting entries
        $this->createAccountingEntries();

        return true;
    }

    /**
     * Cancel the purchase order
     */
    public function cancel(): bool
    {
        if (!$this->canBeCancelled()) {
            return false;
        }

        $this->status = self::STATUS_CANCELLED;
        $this->save();

        // Reverse any accounting entries if needed
        $this->reverseAccountingEntries();

        return true;
    }

    /**
     * Mark as sent
     */
    public function markAsSent(): bool
    {
        if ($this->status !== self::STATUS_APPROVED) {
            return false;
        }

        $this->status = self::STATUS_SENT;
        $this->save();

        return true;
    }

    /**
     * Update status based on received quantities
     */
    public function updateStatusBasedOnReceipts(): void
    {
        $totalOrdered = $this->items()->sum('quantity');
        $totalReceived = $this->items()->sum('received_quantity');

        if ($totalReceived >= $totalOrdered) {
            $this->status = self::STATUS_RECEIVED;
        } elseif ($totalReceived > 0) {
            $this->status = self::STATUS_PARTIALLY_RECEIVED;
        }

        $this->save();
    }

    /**
     * Calculate totals
     */
    public function calculateTotals(): void
    {
        $this->subtotal = $this->items()->sum(\DB::raw('quantity * unit_cost'));
        $this->total_amount = $this->subtotal + $this->tax_amount + $this->shipping_amount - $this->discount_amount;
        $this->save();
    }

    /**
     * Get available statuses
     */
    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_PENDING_APPROVAL => 'Pending Approval',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_SENT => 'Sent',
            self::STATUS_PARTIALLY_RECEIVED => 'Partially Received',
            self::STATUS_RECEIVED => 'Received',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
        ];
    }

    /**
     * Generate PO number
     */
    public static function generatePoNumber(): string
    {
        $lastPo = static::orderBy('po_number', 'desc')->first();
        
        if (!$lastPo) {
            return 'PO001';
        }

        $lastNumber = (int) substr($lastPo->po_number, 2);
        $nextNumber = $lastNumber + 1;

        return 'PO' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Create accounting entries
     */
    protected function createAccountingEntries(): void
    {
        // This would integrate with the accounting module
        // For now, we'll dispatch an event that the accounting module can listen to
        event(new \Modules\Inventory\Events\PurchaseOrderApproved($this));
    }

    /**
     * Reverse accounting entries
     */
    protected function reverseAccountingEntries(): void
    {
        // This would integrate with the accounting module
        event(new \Modules\Inventory\Events\PurchaseOrderCancelled($this));
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($purchaseOrder) {
            if (!$purchaseOrder->po_number) {
                $purchaseOrder->po_number = static::generatePoNumber();
            }

            if (!$purchaseOrder->status) {
                $purchaseOrder->status = self::STATUS_DRAFT;
            }

            if (!$purchaseOrder->order_date) {
                $purchaseOrder->order_date = now();
            }

            if (!$purchaseOrder->currency) {
                $purchaseOrder->currency = 'USD';
            }

            if (!$purchaseOrder->exchange_rate) {
                $purchaseOrder->exchange_rate = 1.0;
            }
        });
    }
}

