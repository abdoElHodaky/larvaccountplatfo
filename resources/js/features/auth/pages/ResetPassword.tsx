import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/shared/components/atoms/Button';
import { FormInput } from '@/shared/components/molecules/FormInput';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.store'));
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
            <Head title='Reset Password' />

            <div className='max-w-md w-full space-y-8'>
                <div>
                    <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>
                        Reset your password
                    </h2>
                    <p className='mt-2 text-center text-sm text-gray-600'>
                        Enter your new password below
                    </p>
                </div>

                <form className='mt-8 space-y-6' onSubmit={submit}>
                    <FormInput
                        label='Email address'
                        type='email'
                        name='email'
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        required
                        autoComplete='email'
                        readOnly
                    />

                    <FormInput
                        label='New Password'
                        type='password'
                        name='password'
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        error={errors.password}
                        required
                        autoComplete='new-password'
                        autoFocus
                    />

                    <FormInput
                        label='Confirm Password'
                        type='password'
                        name='password_confirmation'
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        error={errors.password_confirmation}
                        required
                        autoComplete='new-password'
                    />

                    <Button type='submit' className='w-full' disabled={processing}>
                        {processing ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
