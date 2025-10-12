/**
 * Accounting Feature Pages
 * 
 * This module exports all accounting-related page components.
 * These pages handle chart of accounts, transactions, and journal entries management.
 */

// Dashboard
export { default as Dashboard } from './Dashboard';

// Account pages
export { default as AccountsIndex } from './Accounts/AccountsJournalEntriesTransactionsIndex';
export { default as AccountsCreate } from './Accounts/CreateAccount';
export { default as AccountsShow } from './Accounts/ShowAccount';

// Transaction pages
export { default as TransactionsIndex } from './Transactions/AccountsJournalEntriesTransactionsIndex';

// Journal Entry pages
export { default as JournalEntriesIndex } from './JournalEntries/AccountsJournalEntriesTransactionsIndex';
