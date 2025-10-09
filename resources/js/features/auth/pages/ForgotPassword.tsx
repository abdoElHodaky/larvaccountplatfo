import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/shared/components/atoms/Button';
import { FormInput } from '@/shared/components/molecules/FormInput';

interface ForgotPasswordProps {
    status?: string;
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Head title="Forgot Password" />
            
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Forgot your password?
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        No problem. Just let us know your email address and we will email you a password reset link.
                    </p>
                </div>

                {status && (
                    <div className="rounded-md bg-green-50 p-4">
                        <div className="text-sm text-green-700">{status}</div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={submit}>
                    <FormInput
                        label="Email address"
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        error={errors.email}
                        required
                        autoComplete="email"
                        autoFocus
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={processing}
                    >
                        {processing ? 'Sending...' : 'Email Password Reset Link'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
