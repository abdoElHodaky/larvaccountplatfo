import { gql } from '@apollo/client';

export const GET_DASHBOARD_LAYOUTS = gql`
  query GetDashboardLayouts {
    dashboardLayouts {
      id
      name
      description
      isDefault
      widgets {
        id
        type
        title
        description
        position {
          x
          y
          width
          height
        }
        config
        lastUpdated
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_DASHBOARD_LAYOUT = gql`
  mutation CreateDashboardLayout($input: DashboardLayoutInput!) {
    createDashboardLayout(input: $input) {
      id
      name
      description
      isDefault
      widgets {
        id
        type
        title
        description
        position {
          x
          y
          width
          height
        }
        config
        lastUpdated
      }
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_DASHBOARD_LAYOUT = gql`
  mutation UpdateDashboardLayout($id: ID!, $input: DashboardLayoutInput!) {
    updateDashboardLayout(id: $id, input: $input) {
      id
      name
      description
      isDefault
      widgets {
        id
        type
        title
        description
        position {
          x
          y
          width
          height
        }
        config
        lastUpdated
      }
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_DASHBOARD_LAYOUT = gql`
  mutation DeleteDashboardLayout($id: ID!) {
    deleteDashboardLayout(id: $id) {
      success
      message
    }
  }
`;

export const GET_DASHBOARD_METRICS = gql`
  query GetDashboardMetrics($filters: DashboardFiltersInput) {
    dashboardMetrics(filters: $filters) {
      id
      name
      value
      previousValue
      change
      changePercent
      trend
      format
      period
    }
  }
`;

export const GET_DASHBOARD_CHARTS = gql`
  query GetDashboardCharts($filters: DashboardFiltersInput) {
    dashboardCharts(filters: $filters) {
      id
      type
      title
      data {
        labels
        datasets {
          label
          data
          backgroundColor
          borderColor
          borderWidth
        }
      }
      options
    }
  }
`;

export const CREATE_WIDGET = gql`
  mutation CreateWidget($input: WidgetInput!) {
    createWidget(input: $input) {
      id
      type
      title
      description
      position {
        x
        y
        width
        height
      }
      config
      isActive
      refreshInterval
      dataSource
      userId
      organizationId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_WIDGET = gql`
  mutation UpdateWidget($id: ID!, $input: WidgetInput!) {
    updateWidget(id: $id, input: $input) {
      id
      type
      title
      description
      position {
        x
        y
        width
        height
      }
      config
      isActive
      refreshInterval
      dataSource
      userId
      organizationId
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_WIDGET = gql`
  mutation DeleteWidget($id: ID!) {
    deleteWidget(id: $id) {
      success
      message
    }
  }
`;

export const GET_WIDGET_DATA = gql`
  query GetWidgetData($widgetId: ID!, $filters: WidgetFiltersInput) {
    widgetData(widgetId: $widgetId, filters: $filters) {
      id
      data
      updatedAt
    }
  }
`;