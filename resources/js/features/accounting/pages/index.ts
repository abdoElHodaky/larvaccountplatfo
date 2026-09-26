/**
 * Accounting Feature Pages
 *
 * This module exports all accounting-related page components.
 * These pages handle chart of accounts, transactions, and journal entries management.
 */

// Dashboard
export { default as Dashboard } from './Dashboard';

// Account pages
export { default as AccountsIndex } from './Accounts/AccountsIndex';
export { default as AccountsCreate } from './Accounts/CreateAccount';
export { default as AccountsShow } from './Accounts/ShowAccount';

// Transaction pages
export { default as TransactionsIndex } = './Transactions/TransactionsIndex';

// Journal Entry pages
export { default as JournalEntriesIndex } = './JournalEntries/JournalEntriesIndex';

// Journal Entries Page
export { default as JournalEntriesPage } = './JournalEntriesPage';