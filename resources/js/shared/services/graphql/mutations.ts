/**
 * GraphQL Mutations for Laravel Accounting Platform
 * Comprehensive mutation definitions for all business operations
 */

import { gql } from '@apollo/client';
import { 
  TENANT_FRAGMENT, 
  USER_FRAGMENT, 
  ACCOUNT_FRAGMENT, 
  TRANSACTION_FRAGMENT 
} from './queries';

// Authentication Mutations
export const LOGIN = gql`
  mutation Login($email: String!, $password: String!, $remember: Boolean = false) {
    login(email: $email, password: $password, remember: $remember) {
      user {
        ...UserInfo
      }
      token
      expiresAt
      tenants {
        tenant {
          ...TenantInfo
        }
        role
        permissions
      }
    }
  }
  ${USER_FRAGMENT}
  ${TENANT_FRAGMENT}
`;

export const LOGOUT = gql`
  mutation Logout {
    logout {
      success
      message
    }
  }
`;

export const REGISTER = gql`
  mutation Register(
    $name: String!
    $email: String!
    $password: String!
    $passwordConfirmation: String!
    $tenantName: String
    $tenantSubdomain: String
  ) {
    register(
      name: $name
      email: $email
      password: $password
      password_confirmation: $passwordConfirmation
      tenant_name: $tenantName
      tenant_subdomain: $tenantSubdomain
    ) {
      user {
        ...UserInfo
      }
      token
      tenant {
        ...TenantInfo
      }
    }
  }
  ${USER_FRAGMENT}
  ${TENANT_FRAGMENT}
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email) {
      success
      message
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword(
    $token: String!
    $email: String!
    $password: String!
    $passwordConfirmation: String!
  ) {
    resetPassword(
      token: $token
      email: $email
      password: $password
      password_confirmation: $passwordConfirmation
    ) {
      success
      message
    }
  }
`;

// Tenant Management Mutations
export const CREATE_TENANT = gql`
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      tenant {
        ...TenantInfo
      }
      userRole
    }
  }
  ${TENANT_FRAGMENT}
`;

export const UPDATE_TENANT = gql`
  mutation UpdateTenant($id: ID!, $input: UpdateTenantInput!) {
    updateTenant(id: $id, input: $input) {
      tenant {
        ...TenantInfo
      }
    }
  }
  ${TENANT_FRAGMENT}
`;

export const DELETE_TENANT = gql`
  mutation DeleteTenant($id: ID!) {
    deleteTenant(id: $id) {
      success
      message
    }
  }
`;

export const SWITCH_TENANT = gql`
  mutation SwitchTenant($tenantId: ID!) {
    switchTenant(tenantId: $tenantId) {
      tenant {
        ...TenantInfo
      }
      role
      permissions
      success
    }
  }
  ${TENANT_FRAGMENT}
`;

// User Management Mutations
export const INVITE_USER = gql`
  mutation InviteUser($tenantId: ID!, $input: InviteUserInput!) {
    inviteUser(tenantId: $tenantId, input: $input) {
      invitation {
        id
        email
        role
        permissions
        invitedBy {
          ...UserInfo
        }
        expiresAt
        createdAt
      }
      success
      message
    }
  }
  ${USER_FRAGMENT}
`;

export const UPDATE_USER_ROLE = gql`
  mutation UpdateUserRole($tenantId: ID!, $userId: ID!, $role: String!, $permissions: [String!]) {
    updateUserRole(tenantId: $tenantId, userId: $userId, role: $role, permissions: $permissions) {
      user {
        ...UserInfo
        pivot {
          role
          permissions
        }
      }
      success
    }
  }
  ${USER_FRAGMENT}
`;

export const REMOVE_USER_FROM_TENANT = gql`
  mutation RemoveUserFromTenant($tenantId: ID!, $userId: ID!) {
    removeUserFromTenant(tenantId: $tenantId, userId: $userId) {
      success
      message
    }
  }
`;

// Account Management Mutations
export const CREATE_ACCOUNT = gql`
  mutation CreateAccount($tenantId: ID!, $input: CreateAccountInput!) {
    createAccount(tenantId: $tenantId, input: $input) {
      account {
        ...AccountInfo
        parent {
          ...AccountInfo
        }
      }
    }
  }
  ${ACCOUNT_FRAGMENT}
`;

export const UPDATE_ACCOUNT = gql`
  mutation UpdateAccount($id: ID!, $tenantId: ID!, $input: UpdateAccountInput!) {
    updateAccount(id: $id, tenantId: $tenantId, input: $input) {
      account {
        ...AccountInfo
        parent {
          ...AccountInfo
        }
      }
    }
  }
  ${ACCOUNT_FRAGMENT}
`;

export const DELETE_ACCOUNT = gql`
  mutation DeleteAccount($id: ID!, $tenantId: ID!) {
    deleteAccount(id: $id, tenantId: $tenantId) {
      success
      message
    }
  }
`;

export const ACTIVATE_ACCOUNT = gql`
  mutation ActivateAccount($id: ID!, $tenantId: ID!) {
    activateAccount(id: $id, tenantId: $tenantId) {
      account {
        ...AccountInfo
      }
    }
  }
  ${ACCOUNT_FRAGMENT}
`;

export const DEACTIVATE_ACCOUNT = gql`
  mutation DeactivateAccount($id: ID!, $tenantId: ID!) {
    deactivateAccount(id: $id, tenantId: $tenantId) {
      account {
        ...AccountInfo
      }
    }
  }
  ${ACCOUNT_FRAGMENT}
`;

// Transaction Mutations
export const CREATE_TRANSACTION = gql`
  mutation CreateTransaction($tenantId: ID!, $input: CreateTransactionInput!) {
    createTransaction(tenantId: $tenantId, input: $input) {
      transaction {
        ...TransactionInfo
      }
    }
  }
  ${TRANSACTION_FRAGMENT}
`;

export const UPDATE_TRANSACTION = gql`
  mutation UpdateTransaction($id: ID!, $tenantId: ID!, $input: UpdateTransactionInput!) {
    updateTransaction(id: $id, tenantId: $tenantId, input: $input) {
      transaction {
        ...TransactionInfo
      }
    }
  }
  ${TRANSACTION_FRAGMENT}
`;

export const DELETE_TRANSACTION = gql`
  mutation DeleteTransaction($id: ID!, $tenantId: ID!) {
    deleteTransaction(id: $id, tenantId: $tenantId) {
      success
      message
    }
  }
`;

export const APPROVE_TRANSACTION = gql`
  mutation ApproveTransaction($id: ID!, $tenantId: ID!) {
    approveTransaction(id: $id, tenantId: $tenantId) {
      transaction {
        ...TransactionInfo
      }
    }
  }
  ${TRANSACTION_FRAGMENT}
`;

export const REJECT_TRANSACTION = gql`
  mutation RejectTransaction($id: ID!, $tenantId: ID!, $reason: String) {
    rejectTransaction(id: $id, tenantId: $tenantId, reason: $reason) {
      transaction {
        ...TransactionInfo
      }
    }
  }
  ${TRANSACTION_FRAGMENT}
`;

export const VOID_TRANSACTION = gql`
  mutation VoidTransaction($id: ID!, $tenantId: ID!, $reason: String!) {
    voidTransaction(id: $id, tenantId: $tenantId, reason: $reason) {
      transaction {
        ...TransactionInfo
      }
    }
  }
  ${TRANSACTION_FRAGMENT}
`;

// Bulk Operations
export const BULK_CREATE_TRANSACTIONS = gql`
  mutation BulkCreateTransactions($tenantId: ID!, $transactions: [CreateTransactionInput!]!) {
    bulkCreateTransactions(tenantId: $tenantId, transactions: $transactions) {
      successful {
        ...TransactionInfo
      }
      failed {
        input
        errors
      }
      summary {
        total
        successful
        failed
      }
    }
  }
  ${TRANSACTION_FRAGMENT}
`;

export const BULK_UPDATE_TRANSACTIONS = gql`
  mutation BulkUpdateTransactions($tenantId: ID!, $updates: [BulkUpdateTransactionInput!]!) {
    bulkUpdateTransactions(tenantId: $tenantId, updates: $updates) {
      successful {
        ...TransactionInfo
      }
      failed {
        id
        errors
      }
      summary {
        total
        successful
        failed
      }
    }
  }
  ${TRANSACTION_FRAGMENT}
`;

export const BULK_DELETE_TRANSACTIONS = gql`
  mutation BulkDeleteTransactions($tenantId: ID!, $ids: [ID!]!) {
    bulkDeleteTransactions(tenantId: $tenantId, ids: $ids) {
      successful
      failed {
        id
        reason
      }
      summary {
        total
        successful
        failed
      }
    }
  }
`;

// File Upload Mutations
export const UPLOAD_TRANSACTION_ATTACHMENT = gql`
  mutation UploadTransactionAttachment($transactionId: ID!, $tenantId: ID!, $file: Upload!) {
    uploadTransactionAttachment(transactionId: $transactionId, tenantId: $tenantId, file: $file) {
      attachment {
        id
        filename
        url
        size
        mimeType
        createdAt
      }
    }
  }
`;

export const DELETE_TRANSACTION_ATTACHMENT = gql`
  mutation DeleteTransactionAttachment($id: ID!, $tenantId: ID!) {
    deleteTransactionAttachment(id: $id, tenantId: $tenantId) {
      success
      message
    }
  }
`;

// Import/Export Mutations
export const IMPORT_TRANSACTIONS = gql`
  mutation ImportTransactions($tenantId: ID!, $file: Upload!, $mapping: ImportMappingInput!) {
    importTransactions(tenantId: $tenantId, file: $file, mapping: $mapping) {
      job {
        id
        status
        progress
        totalRows
        processedRows
        successfulRows
        failedRows
      }
    }
  }
`;

export const EXPORT_TRANSACTIONS = gql`
  mutation ExportTransactions($tenantId: ID!, $filters: TransactionFiltersInput!, $format: ExportFormat!) {
    exportTransactions(tenantId: $tenantId, filters: $filters, format: $format) {
      job {
        id
        status
        downloadUrl
        expiresAt
      }
    }
  }
`;

// Report Generation Mutations
export const GENERATE_REPORT = gql`
  mutation GenerateReport($tenantId: ID!, $input: GenerateReportInput!) {
    generateReport(tenantId: $tenantId, input: $input) {
      report {
        id
        type
        name
        parameters
        status
        downloadUrl
        generatedAt
        expiresAt
      }
    }
  }
`;

export const SCHEDULE_REPORT = gql`
  mutation ScheduleReport($tenantId: ID!, $input: ScheduleReportInput!) {
    scheduleReport(tenantId: $tenantId, input: $input) {
      schedule {
        id
        name
        reportType
        parameters
        frequency
        nextRunAt
        isActive
        recipients
        createdAt
      }
    }
  }
`;

// Settings Mutations
export const UPDATE_TENANT_SETTINGS = gql`
  mutation UpdateTenantSettings($tenantId: ID!, $settings: TenantSettingsInput!) {
    updateTenantSettings(tenantId: $tenantId, settings: $settings) {
      tenant {
        ...TenantInfo
      }
    }
  }
  ${TENANT_FRAGMENT}
`;

export const UPDATE_USER_PREFERENCES = gql`
  mutation UpdateUserPreferences($preferences: UserPreferencesInput!) {
    updateUserPreferences(preferences: $preferences) {
      user {
        ...UserInfo
        preferences {
          theme
          language
          dateFormat
          currency
          timezone
          notifications
        }
      }
    }
  }
  ${USER_FRAGMENT}
`;

// Notification Mutations
export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      success
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead($tenantId: ID!) {
    markAllNotificationsRead(tenantId: $tenantId) {
      success
      count
    }
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id) {
      success
    }
  }
`;
