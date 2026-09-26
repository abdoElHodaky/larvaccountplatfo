import { apolloClient } from '@/shared/services/graphql/apolloClient';
import type { ApiResponse } from '@/shared/types';
import type { Account } from '../stores/accountingModel';
import type { AccountingFilters } from '../stores/accountingModel';
import { GET_ACCOUNTS, CREATE_ACCOUNT, UPDATE_ACCOUNT, DELETE_ACCOUNT } from './queries';

export const accountingApi = {
  async getAccounts(filters?: Partial<AccountingFilters>): Promise<ApiResponse<Account[]>> {
    try {
      const { data } = await apolloClient.query({
        query: GET_ACCOUNTS,
        variables: { filters },
      });

      return {
        data: data.accounts,
        success: true,
      };
    } catch (error: any) {
      console.error('Failed to fetch accounts:', error);
      throw new Error(error.message || 'Failed to fetch accounts');
    }
  },

  async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Account>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_ACCOUNT,
        variables: { input: accountData },
        update: (cache: any, { data: mutationData }: { data: { createAccount: Account } | null }) => {
          // Update cache with new account
          const existingAccounts = cache.readQuery({ query: GET_ACCOUNTS });
          if (existingAccounts) {
            cache.writeQuery({
              query: GET_ACCOUNTS,
              data: {
                accounts: [...(existingAccounts as any).accounts, mutationData?.createAccount ?? []],
              },
            });
          }
        },
      });

      return {
        data: data.createAccount,
        success: true,
        message: 'Account created successfully',
      };
    } catch (error: any) {
        console.error('Failed to create account:', error);
        throw new Error(error.message || 'Failed to create account');
    }
  },

  async updateAccount(id: string, accountData: Partial<Account>): Promise<ApiResponse<Account>> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_ACCOUNT,
        variables: { id, input: accountData },
        update: (cache: any, { data: mutationData }: { data: { updateAccount: Account } | null }) => {
          const updatedAccount = mutationData?.updateAccount;
          if (updatedAccount) {
            // Update the cache by replacing the account in the GET_ACCOUNTS query result
            const existingAccounts = cache.readQuery({ query: GET_ACCOUNTS });
            if (existingAccounts) {
              const accounts = (existingAccounts as any).accounts;
              const index = accounts.findIndex((acc: Account) => acc.id === updatedAccount.id);
              if (index !== -1) {
                accounts[index] = updatedAccount;
                cache.writeQuery({
                  query: GET_ACCOUNTS,
                  data: {
                    accounts: accounts,
                  },
                });
              }
            }
          }
        },
      });

      return {
        data: data.updateAccount,
        success: true,
        message: 'Account updated successfully',
      };
    } catch (error: any) {
        console.error('Failed to update account:', error);
        throw new Error(error.message || 'Failed to update account');
    }
  },

  async deleteAccount(id: string): Promise<ApiResponse<void>> {
    try {
      await apolloClient.mutate({
        mutation: DELETE_ACCOUNT,
        variables: { id },
        update: (cache: any) => {
          // Update cache
          cache.modify({
            id: cache.identify({ __typename: 'Account', id }),
            fields: {
              // Remove account from cache
            },
          });
        },
      });

      return {
        success: true,
        data: undefined,
        message: 'Account deleted successfully',
      };
    } catch (error: any) {
        console.error('Failed to delete account:', error);
        throw new Error(error.message || 'Failed to delete account');
    }
  },
};