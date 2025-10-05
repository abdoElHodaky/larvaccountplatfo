<?php

namespace Modules\Organization\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Organization\Services\OrganizationService;
use Modules\Shared\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class OrganizationController extends Controller
{
    /**
     * The organization service.
     */
    protected $organizationService;

    /**
     * Create a new controller instance.
     */
    public function __construct(OrganizationService $organizationService)
    {
        $this->middleware('auth');
        $this->organizationService = $organizationService;
    }

    /**
     * Display a listing of organizations.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Organization::class);

        $organizations = $this->organizationService->getOrganizations([
            'search' => $request->get('search'),
            'country' => $request->get('country'),
            'currency' => $request->get('currency'),
            'is_active' => $request->get('is_active'),
            'per_page' => $request->get('per_page', 15),
        ]);

        if ($request->wantsJson()) {
            return response()->json($organizations);
        }

        return view('organization::index', compact('organizations'));
    }

    /**
     * Show the form for creating a new organization.
     */
    public function create()
    {
        $this->authorize('create', Organization::class);

        $currencies = $this->organizationService->getAvailableCurrencies();
        $timezones = $this->organizationService->getAvailableTimezones();
        $countries = $this->organizationService->getAvailableCountries();

        return view('organization::create', compact('currencies', 'timezones', 'countries'));
    }

    /**
     * Store a newly created organization in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Organization::class);

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('organizations', 'slug'),
            ],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'tax_number' => 'nullable|string|max:50',
            'currency' => 'required|string|size:3',
            'timezone' => 'required|string|max:50',
            'date_format' => 'required|string|max:20',
            'time_format' => 'required|string|max:20',
            'settings' => 'nullable|array',
        ]);

        try {
            $organization = $this->organizationService->createOrganization($validatedData);

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Organization created successfully.',
                    'organization' => $organization,
                ], 201);
            }

            return redirect()->route('organizations.show', $organization)
                           ->with('success', 'Organization created successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to create organization.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withInput()
                        ->withErrors(['error' => 'Failed to create organization: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified organization.
     */
    public function show(Organization $organization)
    {
        $this->authorize('view', $organization);

        $organization->load(['users']);
        $stats = $this->organizationService->getOrganizationStats($organization);

        if (request()->wantsJson()) {
            return response()->json([
                'organization' => $organization,
                'stats' => $stats,
            ]);
        }

        return view('organization::show', compact('organization', 'stats'));
    }

    /**
     * Show the form for editing the specified organization.
     */
    public function edit(Organization $organization)
    {
        $this->authorize('update', $organization);

        $currencies = $this->organizationService->getAvailableCurrencies();
        $timezones = $this->organizationService->getAvailableTimezones();
        $countries = $this->organizationService->getAvailableCountries();

        return view('organization::edit', compact('organization', 'currencies', 'timezones', 'countries'));
    }

    /**
     * Update the specified organization in storage.
     */
    public function update(Request $request, Organization $organization)
    {
        $this->authorize('update', $organization);

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('organizations', 'slug')->ignore($organization->id),
            ],
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'tax_number' => 'nullable|string|max:50',
            'currency' => 'required|string|size:3',
            'timezone' => 'required|string|max:50',
            'date_format' => 'required|string|max:20',
            'time_format' => 'required|string|max:20',
            'settings' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        try {
            $organization = $this->organizationService->updateOrganization($organization, $validatedData);

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Organization updated successfully.',
                    'organization' => $organization,
                ]);
            }

            return redirect()->route('organizations.show', $organization)
                           ->with('success', 'Organization updated successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to update organization.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withInput()
                        ->withErrors(['error' => 'Failed to update organization: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified organization from storage.
     */
    public function destroy(Organization $organization)
    {
        $this->authorize('delete', $organization);

        try {
            $this->organizationService->deleteOrganization($organization);

            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Organization deleted successfully.',
                ]);
            }

            return redirect()->route('organizations.index')
                           ->with('success', 'Organization deleted successfully.');
        } catch (\Exception $e) {
            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to delete organization.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to delete organization: ' . $e->getMessage()]);
        }
    }

    /**
     * Get organization settings.
     */
    public function settings(Organization $organization)
    {
        $this->authorize('update', $organization);

        $settings = $this->organizationService->getOrganizationSettings($organization);

        if (request()->wantsJson()) {
            return response()->json(['settings' => $settings]);
        }

        return view('organization::settings', compact('organization', 'settings'));
    }

    /**
     * Update organization settings.
     */
    public function updateSettings(Request $request, Organization $organization)
    {
        $this->authorize('update', $organization);

        $validatedData = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable',
        ]);

        try {
            $this->organizationService->updateOrganizationSettings(
                $organization, 
                $validatedData['settings']
            );

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Settings updated successfully.',
                ]);
            }

            return back()->with('success', 'Settings updated successfully.');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to update settings.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to update settings: ' . $e->getMessage()]);
        }
    }

    /**
     * Get organization users.
     */
    public function users(Organization $organization)
    {
        $this->authorize('view', $organization);

        $users = $this->organizationService->getOrganizationUsers($organization, [
            'search' => request()->get('search'),
            'role' => request()->get('role'),
            'is_active' => request()->get('is_active'),
            'per_page' => request()->get('per_page', 15),
        ]);

        if (request()->wantsJson()) {
            return response()->json($users);
        }

        return view('organization::users', compact('organization', 'users'));
    }

    /**
     * Export organization data.
     */
    public function export(Organization $organization)
    {
        $this->authorize('view', $organization);

        try {
            $exportData = $this->organizationService->exportOrganizationData($organization);

            return response()->json([
                'message' => 'Export completed successfully.',
                'data' => $exportData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to export organization data.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get organization dashboard data.
     */
    public function dashboard(Organization $organization)
    {
        $this->authorize('view', $organization);

        $dashboardData = $this->organizationService->getDashboardData($organization);

        if (request()->wantsJson()) {
            return response()->json($dashboardData);
        }

        return view('organization::dashboard', compact('organization', 'dashboardData'));
    }

    /**
     * Toggle organization status.
     */
    public function toggleStatus(Organization $organization)
    {
        $this->authorize('update', $organization);

        try {
            $organization = $this->organizationService->toggleOrganizationStatus($organization);

            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Organization status updated successfully.',
                    'organization' => $organization,
                ]);
            }

            return back()->with('success', 'Organization status updated successfully.');
        } catch (\Exception $e) {
            if (request()->wantsJson()) {
                return response()->json([
                    'message' => 'Failed to update organization status.',
                    'error' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => 'Failed to update status: ' . $e->getMessage()]);
        }
    }
}

