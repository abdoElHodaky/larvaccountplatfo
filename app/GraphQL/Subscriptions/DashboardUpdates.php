<?php

namespace App\GraphQL\Subscriptions;

use Nuwave\Lighthouse\Subscriptions\Subscriber;
use Nuwave\Lighthouse\Schema\Types\GraphQLSubscription;

class DashboardUpdates extends GraphQLSubscription
{
    /**
     * Check if subscriber is allowed to listen to the subscription.
     */
    public function authorize(Subscriber $subscriber, array $args): bool
    {
        $user = $subscriber->context->user();
        $organizationId = $args['organizationId'];

        return $user && $user->organizations()->where('id', $organizationId)->exists();
    }

    /**
     * Filter which subscribers should receive the subscription update.
     */
    public function filter(Subscriber $subscriber, array $args): bool
    {
        $organizationId = $args['organizationId'];
        
        return $this->root->organization_id == $organizationId;
    }
}
