<?php

namespace App\GraphQL\Subscriptions;

use Nuwave\Lighthouse\Schema\Types\GraphQLSubscription;
use Nuwave\Lighthouse\Subscriptions\Subscriber;

class TransactionUpdates extends GraphQLSubscription
{
    /**
     * Check if subscriber is allowed to listen to the subscription.
     */
    public function authorize(Subscriber $subscriber, array $args): bool
    {
        $user = $subscriber->context->user();
        $organizationId = $args['organizationId'];

        // Simple authorization: user must belong to the organization
        return $user && $user->organizations()->where('id', $organizationId)->exists();
    }

    /**
     * Filter which subscribers should receive the subscription update.
     */
    public function filter(Subscriber $subscriber, array $args): bool
    {
        $organizationId = $args['organizationId'];

        // Only send updates for the requested organization
        return $this->root->organization_id == $organizationId;
    }
}
