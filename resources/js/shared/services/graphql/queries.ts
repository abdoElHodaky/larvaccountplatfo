/**
 * GraphQL Queries for Laravel Accounting Platform
 * Comprehensive query definitions for all business entities
 */

import { gql } from '@apollo/client';

// Fragment definitions for reusability
export const TENANT_FRAGMENT = gql`
    fragment TenantInfo on Tenant {
        id
        name
        subdomain
        plan
        status
        settings {
            currency
            dateFormat
            timezone
            fiscalYearStart
        }
        enabledModules
        createdAt
        updatedAt
    }
`;

export const USER_FRAGMENT = gql`
    fragment UserInfo on User {
        id
        name
        email
        avatar
        role
        permissions
        lastLoginAt
        createdAt
        updatedAt
    }
`;

export const ACCOUNT_FRAGMENT = gql`
    fragment AccountInfo on Account {
        id
        code
        name
        type
        subtype
        parentId
        balance
        isActive
        description
        createdAt
        updatedAt
    }
`;

export const TRANSACTION_FRAGMENT = gql`
    fragment TransactionInfo on Transaction {
        id
        reference
        description
        date
        amount
        type
        status
        entries {
            id
            accountId
            account {
                ...AccountInfo
            }
            debit
            credit
            description
        }
        attachments {
            id
            filename
            url
            size
            mimeType
        }
        createdBy {
            ...UserInfo
        }
        createdAt
        updatedAt
    }
    ${ACCOUNT_FRAGMENT}
    ${USER_FRAGMENT}
`;

// Authentication Queries
export const GET_CURRENT_USER = gql`
    query GetCurrentUser {
        me {
            ...UserInfo
            tenants {
                tenant {
                    ...TenantInfo
                }
                role
                permissions
                joinedAt
            }
        }
    }
    ${USER_FRAGMENT}
    ${TENANT_FRAGMENT}
`;

export const GET_TENANT_USERS = gql`
    query GetTenantUsers($tenantId: ID!, $first: Int = 20, $page: Int = 1) {
        tenantUsers(tenantId: $tenantId, first: $first, page: $page) {
            data {
                ...UserInfo
                pivot {
                    role
                    permissions
                    joinedAt
                }
            }
            paginatorInfo {
                count
                currentPage
                firstItem
                hasMorePages
                lastItem
                lastPage
                perPage
                total
            }
        }
    }
    ${USER_FRAGMENT}
`;

// Tenant Management Queries
export const GET_TENANT_DETAILS = gql`
    query GetTenantDetails($id: ID!) {
        tenant(id: $id) {
            ...TenantInfo
            users {
                ...UserInfo
                pivot {
                    role
                    permissions
                    joinedAt
                }
            }
            statistics {
                totalUsers
                totalAccounts
                totalTransactions
                monthlyTransactions
                totalBalance
            }
        }
    }
    ${TENANT_FRAGMENT}
    ${USER_FRAGMENT}
`;

export const GET_USER_TENANTS = gql`
    query GetUserTenants {
        userTenants {
            tenant {
                ...TenantInfo
            }
            role
            permissions
            joinedAt
            lastAccessedAt
        }
    }
    ${TENANT_FRAGMENT}
`;

// Chart of Accounts Queries
export const GET_CHART_OF_ACCOUNTS = gql`
    query GetChartOfAccounts($tenantId: ID!, $type: AccountType, $active: Boolean = true) {
        accounts(tenantId: $tenantId, type: $type, active: $active) {
            ...AccountInfo
            children {
                ...AccountInfo
                children {
                    ...AccountInfo
                }
            }
            parent {
                id
                name
                code
            }
            transactionCount
            lastTransactionDate
        }
    }
    ${ACCOUNT_FRAGMENT}
`;

export const GET_ACCOUNT_DETAILS = gql`
    query GetAccountDetails($id: ID!, $tenantId: ID!) {
        account(id: $id, tenantId: $tenantId) {
            ...AccountInfo
            parent {
                ...AccountInfo
            }
            children {
                ...AccountInfo
            }
            transactions(first: 10) {
                data {
                    ...TransactionInfo
                }
                paginatorInfo {
                    total
                    hasMorePages
                }
            }
            balanceHistory(days: 30) {
                date
                balance
            }
        }
    }
    ${ACCOUNT_FRAGMENT}
    ${TRANSACTION_FRAGMENT}
`;

// Transaction Queries
export const GET_TRANSACTIONS = gql`
    query GetTransactions(
        $tenantId: ID!
        $first: Int = 20
        $page: Int = 1
        $dateFrom: Date
        $dateTo: Date
        $accountId: ID
        $type: TransactionType
        $status: TransactionStatus
        $search: String
    ) {
        transactions(
            tenantId: $tenantId
            first: $first
            page: $page
            dateFrom: $dateFrom
            dateTo: $dateTo
            accountId: $accountId
            type: $type
            status: $status
            search: $search
        ) {
            data {
                ...TransactionInfo
            }
            paginatorInfo {
                count
                currentPage
                firstItem
                hasMorePages
                lastItem
                lastPage
                perPage
                total
            }
        }
    }
    ${TRANSACTION_FRAGMENT}
`;

export const GET_TRANSACTION_DETAILS = gql`
    query GetTransactionDetails($id: ID!, $tenantId: ID!) {
        transaction(id: $id, tenantId: $tenantId) {
            ...TransactionInfo
            auditLog {
                id
                action
                changes
                user {
                    ...UserInfo
                }
                createdAt
            }
        }
    }
    ${TRANSACTION_FRAGMENT}
    ${USER_FRAGMENT}
`;

// Financial Reports Queries
export const GET_TRIAL_BALANCE = gql`
    query GetTrialBalance(
        $tenantId: ID!
        $periodStart: Date!
        $periodEnd: Date!
        $includeZeroBalances: Boolean = false
    ) {
        trialBalance(
            tenantId: $tenantId
            periodStart: $periodStart
            periodEnd: $periodEnd
            includeZeroBalances: $includeZeroBalances
        ) {
            periodStart
            periodEnd
            generatedAt
            accounts {
                account {
                    ...AccountInfo
                }
                openingBalance
                debitMovements
                creditMovements
                closingBalance
                debitBalance
                creditBalance
            }
            totals {
                totalDebits
                totalCredits
                difference
                isBalanced
            }
        }
    }
    ${ACCOUNT_FRAGMENT}
`;

export const GET_INCOME_STATEMENT = gql`
    query GetIncomeStatement(
        $tenantId: ID!
        $periodStart: Date!
        $periodEnd: Date!
        $compareWithPrevious: Boolean = false
    ) {
        incomeStatement(
            tenantId: $tenantId
            periodStart: $periodStart
            periodEnd: $periodEnd
            compareWithPrevious: $compareWithPrevious
        ) {
            periodStart
            periodEnd
            generatedAt
            revenue {
                account {
                    ...AccountInfo
                }
                currentPeriod
                previousPeriod
                variance
                variancePercent
            }
            expenses {
                account {
                    ...AccountInfo
                }
                currentPeriod
                previousPeriod
                variance
                variancePercent
            }
            totals {
                totalRevenue
                totalExpenses
                netIncome
                previousNetIncome
                netIncomeVariance
                netIncomeVariancePercent
            }
        }
    }
    ${ACCOUNT_FRAGMENT}
`;

export const GET_BALANCE_SHEET = gql`
    query GetBalanceSheet($tenantId: ID!, $asOfDate: Date!, $compareWithPrevious: Boolean = false) {
        balanceSheet(
            tenantId: $tenantId
            asOfDate: $asOfDate
            compareWithPrevious: $compareWithPrevious
        ) {
            asOfDate
            generatedAt
            assets {
                currentAssets {
                    account {
                        ...AccountInfo
                    }
                    currentBalance
                    previousBalance
                    variance
                    variancePercent
                }
                fixedAssets {
                    account {
                        ...AccountInfo
                    }
                    currentBalance
                    previousBalance
                    variance
                    variancePercent
                }
                totalAssets
                previousTotalAssets
            }
            liabilities {
                currentLiabilities {
                    account {
                        ...AccountInfo
                    }
                    currentBalance
                    previousBalance
                    variance
                    variancePercent
                }
                longTermLiabilities {
                    account {
                        ...AccountInfo
                    }
                    currentBalance
                    previousBalance
                    variance
                    variancePercent
                }
                totalLiabilities
                previousTotalLiabilities
            }
            equity {
                equityAccounts {
                    account {
                        ...AccountInfo
                    }
                    currentBalance
                    previousBalance
                    variance
                    variancePercent
                }
                totalEquity
                previousTotalEquity
            }
            totals {
                totalLiabilitiesAndEquity
                previousTotalLiabilitiesAndEquity
                isBalanced
            }
        }
    }
    ${ACCOUNT_FRAGMENT}
`;

// Dashboard and Analytics Queries
export const GET_DASHBOARD_DATA = gql`
    query GetDashboardData($tenantId: ID!, $period: DashboardPeriod = CURRENT_MONTH) {
        dashboard(tenantId: $tenantId, period: $period) {
            metrics {
                totalRevenue
                totalExpenses
                netIncome
                cashFlow
                accountsReceivable
                accountsPayable
                bankBalance
            }
            trends {
                revenueChart {
                    date
                    amount
                }
                expenseChart {
                    date
                    amount
                }
                profitChart {
                    date
                    amount
                }
            }
            recentTransactions {
                ...TransactionInfo
            }
            alerts {
                id
                type
                message
                severity
                createdAt
            }
        }
    }
    ${TRANSACTION_FRAGMENT}
`;

// Real-time Subscriptions
export const TRANSACTION_UPDATES = gql`
    subscription TransactionUpdates($tenantId: ID!) {
        transactionUpdated(tenantId: $tenantId) {
            mutation
            node {
                ...TransactionInfo
            }
        }
    }
    ${TRANSACTION_FRAGMENT}
`;

export const ACCOUNT_BALANCE_UPDATES = gql`
    subscription AccountBalanceUpdates($tenantId: ID!, $accountIds: [ID!]) {
        accountBalanceUpdated(tenantId: $tenantId, accountIds: $accountIds) {
            accountId
            newBalance
            previousBalance
            updatedAt
        }
    }
`;

export const TENANT_NOTIFICATIONS = gql`
    subscription TenantNotifications($tenantId: ID!) {
        tenantNotification(tenantId: $tenantId) {
            id
            type
            title
            message
            data
            user {
                ...UserInfo
            }
            createdAt
        }
    }
    ${USER_FRAGMENT}
`;
