# Frontend Reorganization - Dependency Analysis

## Import Pattern Analysis

### Most Frequently Imported Modules:
     23 import { useMemoizedCallback } from '@/shared/hooks';
     10 import { CardContainer } from '@/Components/Base';
      7 import { FinancialPerformanceUtils } from '@/shared/utils/performance';
      6 import AppLayout from '@/shared/components/layouts/AppLayout';
      5 import { useMemoizedCallback, useDebounce } from '@/shared/hooks';
      3 import { useFinancialWebSocket } from '@/shared/utils/websocket';
      3 import PrimaryButton from '@/Components/PrimaryButton';
      3 import AuthLayout from '@/shared/components/layouts/AuthLayout';
      2 import { shallowEqual } from '@/shared/utils/performance';
      2 import TextInput from '@/Components/TextInput';
      2 import InputLabel from '@/Components/InputLabel';
      2 import InputError from '@/Components/InputError';
      1 import { useReportBuilder } from '@/features/reporting/hooks';
      1 import { cn } from '@/shared/utils/cn';
      1 import { Transaction, Account, PageProps, PaginatedData } from '@/shared/types';
      1 import { Select } from '@/Components/UI/Select';
      1 import { JournalEntry, PageProps, PaginatedData } from '@/shared/types';
      1 import { Input } from '@/Components/UI/Input';
      1 import { DataTable, DataTableProps } from '@/Components/Tables';
      1 import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
      1 import { Button } from '@/Components/UI/Button';
      1 import { AppLayout } from '@/Components/Base';
      1 import { Account, PageProps, SelectOption } from '@/shared/types';
      1 import { Account, PageProps, PaginatedData } from '@/shared/types';
      1 import { Account, AccountBalance, Transaction, PageProps, PaginatedData } from '@/shared/types';
      1 import { Account } from '@/shared/types';
      1 import theme from '@/shared/theme';
      1 import UserManagement, { User } from '@/Components/Settings/UserManagement';
      1 import TopBar from '@/Components/Navigation/TopBar';
      1 import TenantSwitcher from '@/Components/TenantSwitcher';
      1 import Sidebar from '@/Components/Navigation/Sidebar';

### Directory Usage Analysis:

#### Hook Locations:
-rw-r--r-- 1 root root   246 Oct  8 18:40 resources/js/Hooks/index.ts
-rw-r--r-- 1 root root  7611 Oct  8 18:40 resources/js/Hooks/useChartData.ts
-rw-r--r-- 1 root root  2729 Oct  8 18:40 resources/js/Hooks/useDebounce.ts
-rw-r--r-- 1 root root  9688 Oct  8 18:40 resources/js/Hooks/useFormValidation.ts
-rw-r--r-- 1 root root  4838 Oct  8 18:40 resources/js/Hooks/useMemoizedCallback.ts
-rw-r--r-- 1 root root 10972 Oct  8 18:40 resources/js/Hooks/useReportBuilder.ts
-rw-r--r-- 1 root root   561 Oct  8 18:40 resources/js/features/reporting/hooks/index.ts
-rw-r--r-- 1 root root  7611 Oct  8 18:40 resources/js/features/reporting/hooks/useChartData.ts
-rw-r--r-- 1 root root 10972 Oct  8 18:40 resources/js/features/reporting/hooks/useReportBuilder.ts
-rw-r--r-- 1 root root   814 Oct  9 05:22 resources/js/shared/hooks/index.ts
-rw-r--r-- 1 root root  2729 Oct  8 18:40 resources/js/shared/hooks/useDebounce.ts
-rw-r--r-- 1 root root  9688 Oct  9 05:22 resources/js/shared/hooks/useFormValidation.ts
-rw-r--r-- 1 root root  4838 Oct  8 18:40 resources/js/shared/hooks/useMemoizedCallback.ts
-rw-r--r-- 1 root root 10627 Oct  8 18:40 resources/js/src/hooks/useAlovaAdvanced.ts
-rw-r--r-- 1 root root  9420 Oct  8 18:40 resources/js/src/hooks/useFinancialData.ts
-rw-r--r-- 1 root root  8661 Oct  8 18:40 resources/js/src/hooks/useGraphQL.ts
-rw-r--r-- 1 root root 12114 Oct  8 18:40 resources/js/src/hooks/useRealTime.ts
-rw-r--r-- 1 root root 11201 Oct  8 18:40 resources/js/src/hooks/useRealTimeNotifications.ts
-rw-r--r-- 1 root root  8523 Oct  8 18:40 resources/js/src/hooks/useRematchStore.ts

## Phase 2: Consolidating Duplicate Utilities and Types

### Actions Taken:
1. Identified duplicate hooks and utilities
2. Keeping shared/ versions as they are more frequently imported
3. Moving unique hooks from root Hooks/ to shared/hooks/
4. Updating all import statements

