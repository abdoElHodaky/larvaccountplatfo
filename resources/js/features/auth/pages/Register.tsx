import React, { FormEvent, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthLayout from '@/shared/components/layouts/AuthLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    organization_name: string;
    organization_subdomain: string;
    terms: boolean;
}

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterData>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        organization_name: '',
        organization_subdomain: '',
        terms: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const submit = (e: FormEvent) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const generateSubdomain = (orgName: string) => {
        const subdomain = orgName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 20);
        
        setData('organization_subdomain', subdomain);
    };

    return (
        <AuthLayout>
            <Head title="Create Account" />

            <div className="w-full max-w-2xl mx-auto">
                <div className="bg-white shadow-lg rounded-lg px-8 py-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
                        <p className="text-gray-600 mt-2">Start your accounting journey today</p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        {/* Personal Information */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="name" value="Full Name" />
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        className="mt-1 block w-full"
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter your full name"
                                        required
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value="Email Address" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-1 block w-full"
                                        autoComplete="username"
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="Enter your email address"
                                        required
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <InputLabel htmlFor="password" value="Password" />
                                    <div className="relative mt-1">
                                        <TextInput
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={data.password}
                                            className="block w-full pr-10"
                                            autoComplete="new-password"
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Create a strong password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.415 1.415m-1.415-1.415l1.415 1.415M14.828 14.828L16.243 16.243" />
                                                </svg>
                                            ) : (
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                                    <div className="relative mt-1">
                                        <TextInput
                                            id="password_confirmation"
                                            type={showPasswordConfirmation ? 'text' : 'password'}
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            className="block w-full pr-10"
                                            autoComplete="new-password"
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="Confirm your password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                        >
                                            {showPasswordConfirmation ? (
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.415 1.415m-1.415-1.415l1.415 1.415M14.828 14.828L16.243 16.243" />
                                                </svg>
                                            ) : (
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={errors.password_confirmation} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        {/* Organization Information */}
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Information</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="organization_name" value="Organization Name" />
                                    <TextInput
                                        id="organization_name"
                                        name="organization_name"
                                        value={data.organization_name}
                                        className="mt-1 block w-full"
                                        onChange={(e) => {
                                            setData('organization_name', e.target.value);
                                            if (!data.organization_subdomain || data.organization_subdomain === '') {
                                                generateSubdomain(e.target.value);
                                            }
                                        }}
                                        placeholder="Enter your organization name"
                                        required
                                    />
                                    <InputError message={errors.organization_name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="organization_subdomain" value="Subdomain" />
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <TextInput
                                            id="organization_subdomain"
                                            name="organization_subdomain"
                                            value={data.organization_subdomain}
                                            className="flex-1 rounded-none rounded-l-md"
                                            onChange={(e) => setData('organization_subdomain', e.target.value)}
                                            placeholder="your-org"
                                            required
                                        />
                                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                            .yourapp.com
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                        This will be your organization's unique URL
                                    </p>
                                    <InputError message={errors.organization_subdomain} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="terms"
                                    name="terms"
                                    type="checkbox"
                                    checked={data.terms}
                                    onChange={(e) => setData('terms', e.target.checked)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                    required
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="terms" className="text-gray-700">
                                    I agree to the{' '}
                                    <Link href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>
                        </div>
                        <InputError message={errors.terms} className="mt-2" />

                        <div>
                            <PrimaryButton 
                                className="w-full justify-center py-3" 
                                disabled={processing}
                            >
                                {processing ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </div>
                                ) : (
                                    'Create Account'
                                )}
                            </PrimaryButton>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link
                                href={route('login')}
                                className="font-medium text-blue-600 hover:text-blue-500"
                            >
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Features Preview */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-white rounded-lg p-4 shadow">
                        <div className="text-blue-600 text-2xl mb-2">📊</div>
                        <h4 className="font-semibold text-gray-900">Financial Reports</h4>
                        <p className="text-sm text-gray-600">Comprehensive reporting</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                        <div className="text-green-600 text-2xl mb-2">💰</div>
                        <h4 className="font-semibold text-gray-900">Multi-Currency</h4>
                        <p className="text-sm text-gray-600">Global business support</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                        <div className="text-purple-600 text-2xl mb-2">🔒</div>
                        <h4 className="font-semibold text-gray-900">Secure & Compliant</h4>
                        <p className="text-sm text-gray-600">Enterprise-grade security</p>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
