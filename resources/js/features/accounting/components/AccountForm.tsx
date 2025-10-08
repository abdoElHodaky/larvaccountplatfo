import React, { useState, ChangeEvent } from 'react';
import { useForm } from '@inertiajs/react';
import { 
  Box, 
  VStack, 
  Button, 
  Input, 
  Select, 
  Card, 
  CardBody, 
  CardHeader, 
  Heading,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Textarea
} from '@chakra-ui/react';

interface Account {
    id?: number;
    code: string;
    name: string;
    type: string;
    subtype: string;
    parent_id?: number;
    description?: string;
    is_active: boolean;
}

interface AccountFormProps {
    account?: Account;
    accounts: Account[];
    onSubmit: (data: Account) => void;
    onCancel: () => void;
}

const accountTypes = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' },
];

const accountSubtypes = {
    asset: [
        { value: 'current_asset', label: 'Current Asset' },
        { value: 'fixed_asset', label: 'Fixed Asset' },
        { value: 'other_asset', label: 'Other Asset' },
    ],
    liability: [
        { value: 'current_liability', label: 'Current Liability' },
        { value: 'long_term_liability', label: 'Long-term Liability' },
        { value: 'other_liability', label: 'Other Liability' },
    ],
    equity: [
        { value: 'owner_equity', label: 'Owner\'s Equity' },
        { value: 'retained_earnings', label: 'Retained Earnings' },
    ],
    revenue: [
        { value: 'operating_revenue', label: 'Operating Revenue' },
        { value: 'other_revenue', label: 'Other Revenue' },
    ],
    expense: [
        { value: 'operating_expense', label: 'Operating Expense' },
        { value: 'other_expense', label: 'Other Expense' },
    ],
};

export default function AccountForm({ account, accounts, onSubmit, onCancel }: AccountFormProps) {
    const { data, setData, processing, errors } = useForm<Account>({
        code: account?.code || '',
        name: account?.name || '',
        type: account?.type || 'asset',
        subtype: account?.subtype || 'current_asset',
        parent_id: account?.parent_id || undefined,
        description: account?.description || '',
        is_active: account?.is_active ?? true,
    });

    const [selectedType, setSelectedType] = useState(data.type);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(data);
    };

    const handleTypeChange = (type: string) => {
        setSelectedType(type);
        setData({
            ...data,
            type,
            subtype: accountSubtypes[type as keyof typeof accountSubtypes]?.[0]?.value || '',
        });
    };

    const parentAccountOptions = accounts
        .filter(acc => acc.type === data.type && acc.id !== account?.id)
        .map(acc => ({
            value: acc.id?.toString() || '',
            label: `${acc.code} - ${acc.name}`,
        }));

    return (
        <Card maxW="2xl" mx="auto">
            <CardHeader>
                <Heading size="lg">
                    {account ? 'Edit Account' : 'Create New Account'}
                </Heading>
            </CardHeader>
            <CardBody>
                <Box as="form" onSubmit={handleSubmit}>
                    <VStack spacing={6}>
                        <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} w="full">
                            <FormControl isRequired isInvalid={!!errors.code}>
                                <FormLabel>Account Code</FormLabel>
                                <Input
                                    value={data.code}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setData('code', e.target.value)}
                                    placeholder="e.g., 1000"
                                />
                                <FormErrorMessage>{errors.code}</FormErrorMessage>
                            </FormControl>
                            
                            <FormControl isRequired isInvalid={!!errors.name}>
                                <FormLabel>Account Name</FormLabel>
                                <Input
                                    value={data.name}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setData('name', e.target.value)}
                                    placeholder="e.g., Cash"
                                />
                                <FormErrorMessage>{errors.name}</FormErrorMessage>
                            </FormControl>
                        </Box>

                        <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} w="full">
                            <FormControl isRequired isInvalid={!!errors.type}>
                                <FormLabel>Account Type</FormLabel>
                                <Select
                                    value={data.type}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handleTypeChange(e.target.value)}
                                    placeholder="Select Type"
                                >
                                    {accountTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </Select>
                                <FormErrorMessage>{errors.type}</FormErrorMessage>
                            </FormControl>
                            
                            <FormControl isRequired isInvalid={!!errors.subtype}>
                                <FormLabel>Account Subtype</FormLabel>
                                <Select
                                    value={data.subtype}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setData('subtype', e.target.value)}
                                    placeholder="Select Subtype"
                                    isDisabled={!data.type}
                                >
                                    {data.type && accountSubtypes[data.type as keyof typeof accountSubtypes]?.map((subtype) => (
                                        <option key={subtype.value} value={subtype.value}>
                                            {subtype.label}
                                        </option>
                                    ))}
                                </Select>
                                <FormErrorMessage>{errors.subtype}</FormErrorMessage>
                            </FormControl>
                        </Box>

                        {parentAccountOptions.length > 0 && (
                            <FormControl isInvalid={!!errors.parent_id}>
                                <FormLabel>Parent Account (Optional)</FormLabel>
                                <Select
                                    value={data.parent_id?.toString() || ''}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                                        setData('parent_id', e.target.value ? parseInt(e.target.value) : undefined)
                                    }
                                    placeholder="No Parent Account"
                                >
                                    {parentAccountOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Select>
                                <FormErrorMessage>{errors.parent_id}</FormErrorMessage>
                            </FormControl>
                        )}

                        <FormControl>
                            <FormLabel>Description (Optional)</FormLabel>
                            <Textarea
                                value={data.description || ''}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                                placeholder="Account description"
                                rows={3}
                            />
                        </FormControl>

                        <Box display="flex" justifyContent="end" gap={3} w="full">
                            <Button
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                colorScheme="blue"
                                isLoading={processing}
                                loadingText="Saving..."
                            >
                                {account ? 'Update Account' : 'Create Account'}
                            </Button>
                        </Box>
                    </VStack>
                </Box>
            </CardBody>
        </Card>
    );
}
