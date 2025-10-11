import React, { useState } from 'react';
import { Button } from '@/shared/components/atoms/Button';
import { FormInput } from '@/shared/components/molecules/FormInput';
import { FormSelect } from '@/shared/components/molecules/FormSelect';
import { CardContainer } from '@/shared/components/molecules/Container';
import { useAccountTypes, useCreateAccount, useUpdateAccount, type Account, type CreateAccountData } from '../hooks/useAccountData';
import { AnimatedFormField, StaggeredChildren } from '@/shared/components/animations/AnimatedFragment';
import { useFormAnimation } from '@/shared/hooks/useAnimation';

interface AccountFormProps {
    account?: Account;
    accounts: Account[];
    onSubmit: (data: CreateAccountData) => void;
    onCancel: () => void;
}
export default function AccountForm({ account, accounts, onSubmit, onCancel }: AccountFormProps) {
    // Get account types and subtypes from hook
    const { accountTypes, accountSubtypes } = useAccountTypes();
    
    // AlovaJS hooks for API operations
    const { loading: creating, send: createAccount } = useCreateAccount();
    const { loading: updating, send: updateAccount } = useUpdateAccount();
    
    // Form state
    const [formData, setFormData] = useState<CreateAccountData>({
        code: account?.code || '',
        name: account?.name || '',
        type: account?.type || 'asset',
        subtype: account?.subtype || 'current_asset',
        parent_id: account?.parent_id || undefined,
        description: account?.description || '',
        is_active: account?.is_active ?? true,
    });
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedType, setSelectedType] = useState(formData.type);
    
    const isLoading = creating || updating;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        
        try {
            if (account?.id) {
                // Update existing account
                await updateAccount({ id: account.id, data: formData });
            } else {
                // Create new account
                await createAccount(formData);
            }
            
            onSubmit(formData);
        } catch (error: any) {
            console.error('Account form error:', error);
            setErrors({ general: error.message || 'An error occurred' });
        }
    };

    const handleTypeChange = (type: string) => {
        setSelectedType(type);
        const newSubtype = accountSubtypes[type as keyof typeof accountSubtypes]?.[0]?.value || '';
        setFormData({
            ...formData,
            type,
            subtype: newSubtype,
        });
    };

    const parentAccountOptions = accounts
        .filter(acc => acc.type === formData.type && acc.id !== account?.id)
        .map(acc => ({
            value: acc.id?.toString() || '',
            label: `${acc.code} - ${acc.name}`,
        }));

    return (
        <CardContainer 
            className="w-full max-w-2xl mx-auto"
            header={
                <h2 className="text-xl font-bold text-gray-900">
                    {account ? 'Edit Account' : 'Create New Account'}
                </h2>
            }
        >
            {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{errors.general}</p>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <StaggeredChildren stagger={0.1} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatedFormField error={!!errors.code}>
                            <FormInput
                                label="Account Code"
                                value={formData.code}
                                onChange={(value) => setFormData({ ...formData, code: value as string })}
                                error={errors.code}
                                isRequired
                                placeholder="e.g., 1000"
                            />
                        </AnimatedFormField>
                        <AnimatedFormField error={!!errors.name}>
                            <FormInput
                                label="Account Name"
                                value={formData.name}
                                onChange={(value) => setFormData({ ...formData, name: value as string })}
                                error={errors.name}
                                isRequired
                                placeholder="e.g., Cash"
                            />
                        </AnimatedFormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatedFormField error={!!errors.type}>
                            <FormSelect
                                label="Account Type"
                                value={formData.type}
                                onChange={(value) => handleTypeChange(value)}
                                options={accountTypes}
                                error={errors.type}
                                isRequired
                            />
                        </AnimatedFormField>
                        <AnimatedFormField error={!!errors.subtype}>
                            <FormSelect
                                label="Account Subtype"
                                value={formData.subtype}
                                onChange={(value) => setFormData({ ...formData, subtype: value })}
                                options={accountSubtypes[selectedType as keyof typeof accountSubtypes] || []}
                                error={errors.subtype}
                                isRequired
                            />
                        </AnimatedFormField>
                    </div>

                    {parentAccountOptions.length > 0 && (
                        <AnimatedFormField error={!!errors.parent_id}>
                            <FormSelect
                                label="Parent Account (Optional)"
                                value={formData.parent_id?.toString() || ''}
                                onChange={(value) => setFormData({ 
                                    ...formData, 
                                    parent_id: value ? value : undefined 
                                })}
                                options={[
                                    { value: '', label: 'No Parent Account' },
                                    ...parentAccountOptions,
                                ]}
                                error={errors.parent_id}
                            />
                        </AnimatedFormField>
                    )}

                    <AnimatedFormField error={!!errors.description}>
                        <FormInput
                            label="Description (Optional)"
                            value={formData.description}
                            onChange={(value) => setFormData({ ...formData, description: value as string })}
                            error={errors.description}
                            placeholder="Brief description of the account"
                        />
                    </AnimatedFormField>

                    <>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                Active Account
                            </label>
                        </div>
                    </>
                </StaggeredChildren>

                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        loading={isLoading}
                    >
                        {account ? 'Update Account' : 'Create Account'}
                    </Button>
                </div>
            </form>
        </CardContainer>
    );
}
