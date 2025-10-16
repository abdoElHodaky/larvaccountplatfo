/**
 * Report Service
 * Handles financial reporting and analytics
 */

import { gql, mutation } from '../../../../shared/services/alova/alova.config';
import { useRequest } from 'alova';

export interface FinancialReport {
  id: string;
  name: string;
  type: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance' | 'custom';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  data: any;
  generatedAt: string;
  organizationId: number;
  parameters?: Record<string, any>;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  configuration: Record<string, any>;
  isDefault: boolean;
  organizationId: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSchedule {
  id: string;
  reportTemplateId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recipients: string[];
  isActive: boolean;
  nextRunDate: string;
  lastRunDate?: string;
  organizationId: number;
}

// GraphQL Queries
const GENERATE_BALANCE_SHEET = gql`
  query GenerateBalanceSheet($organizationId: ID!, $dateRange: DateRangeInput!) {
    balanceSheet(organizationId: $organizationId, dateRange: $dateRange) {
      assets {
        currentAssets {
          cash
          accountsReceivable
          inventory
          prepaidExpenses
          total
        }
        nonCurrentAssets {
          propertyPlantEquipment
          intangibleAssets
          investments
          total
        }
        totalAssets
      }
      liabilities {
        currentLiabilities {
          accountsPayable
          shortTermDebt
          accruedExpenses
          total
        }
        nonCurrentLiabilities {
          longTermDebt
          deferredTax
          total
        }
        totalLiabilities
      }
      equity {
        retainedEarnings
        commonStock
        additionalPaidInCapital
        total
      }
      totalLiabilitiesAndEquity
    }
  }
`;

const GENERATE_INCOME_STATEMENT = gql`
  query GenerateIncomeStatement($organizationId: ID!, $dateRange: DateRangeInput!) {
    incomeStatement(organizationId: $organizationId, dateRange: $dateRange) {
      revenue {
        operatingRevenue
        nonOperatingRevenue
        totalRevenue
      }
      expenses {
        costOfGoodsSold
        operatingExpenses {
          salariesAndWages
          rent
          utilities
          depreciation
          other
          total
        }
        nonOperatingExpenses
        totalExpenses
      }
      grossProfit
      operatingIncome
      netIncome
      earningsPerShare
    }
  }
`;

const GENERATE_CASH_FLOW = gql`
  query GenerateCashFlow($organizationId: ID!, $dateRange: DateRangeInput!) {
    cashFlowStatement(organizationId: $organizationId, dateRange: $dateRange) {
      operatingActivities {
        netIncome
        adjustments {
          depreciation
          accountsReceivableChange
          inventoryChange
          accountsPayableChange
          other
        }
        netCashFromOperating
      }
      investingActivities {
        capitalExpenditures
        investments
        assetSales
        netCashFromInvesting
      }
      financingActivities {
        debtProceeds
        debtRepayments
        equityIssuance
        dividendPayments
        netCashFromFinancing
      }
      netCashChange
      beginningCash
      endingCash
    }
  }
`;

const GENERATE_TRIAL_BALANCE = gql`
  query GenerateTrialBalance($organizationId: ID!, $asOfDate: String!) {
    trialBalance(organizationId: $organizationId, asOfDate: $asOfDate) {
      accounts {
        id
        code
        name
        type
        debitBalance
        creditBalance
      }
      totals {
        totalDebits
        totalCredits
        isBalanced
      }
    }
  }
`;

const GET_REPORT_TEMPLATES = gql`
  query GetReportTemplates($organizationId: ID!) {
    reportTemplates(organizationId: $organizationId) {
      id
      name
      description
      type
      configuration
      isDefault
      createdBy
      createdAt
      updatedAt
    }
  }
`;

const CREATE_REPORT_TEMPLATE = gql`
  mutation CreateReportTemplate($input: CreateReportTemplateInput!) {
    createReportTemplate(input: $input) {
      id
      name
      description
      type
      configuration
      isDefault
      createdAt
    }
  }
`;

const SCHEDULE_REPORT = gql`
  mutation ScheduleReport($input: ScheduleReportInput!) {
    scheduleReport(input: $input) {
      id
      reportTemplateId
      name
      frequency
      recipients
      isActive
      nextRunDate
      createdAt
    }
  }
`;

// Service Functions
export const reportService = {
  /**
   * Generate Balance Sheet
   */
  generateBalanceSheet: (organizationId: string, dateRange: { startDate: string; endDate: string }) => {
    return useRequest(GENERATE_BALANCE_SHEET, {
      variables: { organizationId, dateRange }
    });
  },

  /**
   * Generate Income Statement
   */
  generateIncomeStatement: (organizationId: string, dateRange: { startDate: string; endDate: string }) => {
    return useRequest(GENERATE_INCOME_STATEMENT, {
      variables: { organizationId, dateRange }
    });
  },

  /**
   * Generate Cash Flow Statement
   */
  generateCashFlow: (organizationId: string, dateRange: { startDate: string; endDate: string }) => {
    return useRequest(GENERATE_CASH_FLOW, {
      variables: { organizationId, dateRange }
    });
  },

  /**
   * Generate Trial Balance
   */
  generateTrialBalance: (organizationId: string, asOfDate: string) => {
    return useRequest(GENERATE_TRIAL_BALANCE, {
      variables: { organizationId, asOfDate }
    });
  },

  /**
   * Get report templates
   */
  getReportTemplates: (organizationId: string) => {
    return useRequest(GET_REPORT_TEMPLATES, {
      variables: { organizationId }
    });
  },

  /**
   * Create a new report template
   */
  createReportTemplate: (input: Partial<ReportTemplate>) => {
    return mutation(CREATE_REPORT_TEMPLATE, {
      variables: { input }
    });
  },

  /**
   * Schedule a report
   */
  scheduleReport: (input: Partial<ReportSchedule>) => {
    return mutation(SCHEDULE_REPORT, {
      variables: { input }
    });
  },

  /**
   * Generate custom report
   */
  generateCustomReport: (organizationId: string, configuration: any) => {
    const GENERATE_CUSTOM_REPORT = gql`
      query GenerateCustomReport($organizationId: ID!, $configuration: JSON!) {
        customReport(organizationId: $organizationId, configuration: $configuration) {
          data
          metadata {
            generatedAt
            recordCount
            parameters
          }
        }
      }
    `;

    return useRequest(GENERATE_CUSTOM_REPORT, {
      variables: { organizationId, configuration }
    });
  },

  /**
   * Export report to various formats
   */
  exportReport: (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    const EXPORT_REPORT = gql`
      mutation ExportReport($reportId: ID!, $format: String!) {
        exportReport(reportId: $reportId, format: $format) {
          downloadUrl
          expiresAt
        }
      }
    `;

    return mutation(EXPORT_REPORT, {
      variables: { reportId, format }
    });
  }
};

export default reportService;

