import { ComponentStyleConfig } from '@chakra-ui/react';

/**
 * Custom component styles for accounting application
 * Extends Chakra UI components with accounting-specific variants
 */

// Button component customization
export const Button: ComponentStyleConfig = {
  baseStyle: {
    fontWeight: 'semibold',
    borderRadius: 'md',
    _focus: {
      boxShadow: 'outline',
    },
  },
  sizes: {
    sm: {
      fontSize: 'sm',
      px: 3,
      py: 2,
    },
    md: {
      fontSize: 'md',
      px: 4,
      py: 2,
    },
    lg: {
      fontSize: 'lg',
      px: 6,
      py: 3,
    },
  },
  variants: {
    // Financial action variants
    asset: {
      bg: 'asset.500',
      color: 'white',
      _hover: {
        bg: 'asset.600',
        _disabled: {
          bg: 'asset.500',
        },
      },
      _active: { bg: 'asset.700' },
    },
    liability: {
      bg: 'liability.500',
      color: 'white',
      _hover: {
        bg: 'liability.600',
        _disabled: {
          bg: 'liability.500',
        },
      },
      _active: { bg: 'liability.700' },
    },
    equity: {
      bg: 'equity.500',
      color: 'white',
      _hover: {
        bg: 'equity.600',
        _disabled: {
          bg: 'equity.500',
        },
      },
      _active: { bg: 'equity.700' },
    },
    profit: {
      bg: 'profit.500',
      color: 'white',
      _hover: {
        bg: 'profit.600',
        _disabled: {
          bg: 'profit.500',
        },
      },
      _active: { bg: 'profit.700' },
    },
    loss: {
      bg: 'loss.500',
      color: 'white',
      _hover: {
        bg: 'loss.600',
        _disabled: {
          bg: 'loss.500',
        },
      },
      _active: { bg: 'loss.700' },
    },
  },
  defaultProps: {
    size: 'md',
    variant: 'solid',
  },
};

// Card component for financial data display
export const Card: ComponentStyleConfig = {
  baseStyle: {
    container: {
      bg: 'white',
      boxShadow: 'sm',
      borderRadius: 'lg',
      border: '1px solid',
      borderColor: 'gray.200',
      _dark: {
        bg: 'gray.800',
        borderColor: 'gray.600',
      },
    },
    header: {
      px: 6,
      py: 4,
      borderBottom: '1px solid',
      borderColor: 'gray.200',
      _dark: {
        borderColor: 'gray.600',
      },
    },
    body: {
      px: 6,
      py: 4,
    },
    footer: {
      px: 6,
      py: 4,
      borderTop: '1px solid',
      borderColor: 'gray.200',
      _dark: {
        borderColor: 'gray.600',
      },
    },
  },
  variants: {
    // Financial account type cards
    asset: {
      container: {
        borderColor: 'asset.200',
        borderLeftWidth: '4px',
        borderLeftColor: 'asset.500',
      },
    },
    liability: {
      container: {
        borderColor: 'liability.200',
        borderLeftWidth: '4px',
        borderLeftColor: 'liability.500',
      },
    },
    equity: {
      container: {
        borderColor: 'equity.200',
        borderLeftWidth: '4px',
        borderLeftColor: 'equity.500',
      },
    },
    revenue: {
      container: {
        borderColor: 'revenue.200',
        borderLeftWidth: '4px',
        borderLeftColor: 'revenue.500',
      },
    },
    expense: {
      container: {
        borderColor: 'expense.200',
        borderLeftWidth: '4px',
        borderLeftColor: 'expense.500',
      },
    },
    // Status variants
    profit: {
      container: {
        bg: 'profit.50',
        borderColor: 'profit.200',
        _dark: {
          bg: 'profit.900',
          borderColor: 'profit.700',
        },
      },
    },
    loss: {
      container: {
        bg: 'loss.50',
        borderColor: 'loss.200',
        _dark: {
          bg: 'loss.900',
          borderColor: 'loss.700',
        },
      },
    },
  },
  defaultProps: {
    variant: 'outline',
  },
};

// Table component for financial data
export const Table: ComponentStyleConfig = {
  baseStyle: {
    table: {
      fontVariantNumeric: 'lining-nums tabular-nums',
    },
    th: {
      fontWeight: 'semibold',
      textTransform: 'none',
      letterSpacing: 'normal',
      borderColor: 'gray.200',
      _dark: {
        borderColor: 'gray.600',
      },
    },
    td: {
      borderColor: 'gray.200',
      _dark: {
        borderColor: 'gray.600',
      },
    },
  },
  variants: {
    accounting: {
      th: {
        bg: 'gray.50',
        _dark: {
          bg: 'gray.700',
        },
      },
      td: {
        _hover: {
          bg: 'gray.50',
          _dark: {
            bg: 'gray.700',
          },
        },
      },
    },
    financial: {
      table: {
        fontSize: 'sm',
      },
      th: {
        fontSize: 'xs',
        textTransform: 'uppercase',
        letterSpacing: 'wider',
        color: 'gray.600',
        _dark: {
          color: 'gray.300',
        },
      },
      td: {
        fontSize: 'sm',
        fontWeight: 'medium',
      },
    },
  },
  defaultProps: {
    variant: 'simple',
    size: 'md',
  },
};

// Badge component for status indicators
export const Badge: ComponentStyleConfig = {
  baseStyle: {
    px: 2,
    py: 1,
    textTransform: 'none',
    fontSize: 'xs',
    fontWeight: 'semibold',
    borderRadius: 'md',
  },
  variants: {
    // Financial status badges
    asset: {
      bg: 'asset.100',
      color: 'asset.800',
      _dark: {
        bg: 'asset.800',
        color: 'asset.100',
      },
    },
    liability: {
      bg: 'liability.100',
      color: 'liability.800',
      _dark: {
        bg: 'liability.800',
        color: 'liability.100',
      },
    },
    equity: {
      bg: 'equity.100',
      color: 'equity.800',
      _dark: {
        bg: 'equity.800',
        color: 'equity.100',
      },
    },
    revenue: {
      bg: 'revenue.100',
      color: 'revenue.800',
      _dark: {
        bg: 'revenue.800',
        color: 'revenue.100',
      },
    },
    expense: {
      bg: 'expense.100',
      color: 'expense.800',
      _dark: {
        bg: 'expense.800',
        color: 'expense.100',
      },
    },
    profit: {
      bg: 'profit.100',
      color: 'profit.800',
      _dark: {
        bg: 'profit.800',
        color: 'profit.100',
      },
    },
    loss: {
      bg: 'loss.100',
      color: 'loss.800',
      _dark: {
        bg: 'loss.800',
        color: 'loss.100',
      },
    },
  },
  defaultProps: {
    variant: 'subtle',
  },
};

// Input component for forms
export const Input: ComponentStyleConfig = {
  baseStyle: {
    field: {
      fontVariantNumeric: 'lining-nums tabular-nums',
    },
  },
  variants: {
    currency: {
      field: {
        textAlign: 'right',
        fontFamily: 'mono',
        fontWeight: 'medium',
      },
    },
    percentage: {
      field: {
        textAlign: 'right',
        fontFamily: 'mono',
        fontWeight: 'medium',
      },
    },
    account: {
      field: {
        fontFamily: 'mono',
        fontWeight: 'medium',
      },
    },
  },
  defaultProps: {
    variant: 'outline',
    size: 'md',
  },
};

// Stat component for financial metrics
export const Stat: ComponentStyleConfig = {
  baseStyle: {
    container: {
      px: 4,
      py: 3,
    },
    label: {
      fontWeight: 'medium',
      fontSize: 'sm',
      color: 'gray.600',
      _dark: {
        color: 'gray.300',
      },
    },
    number: {
      fontSize: '2xl',
      fontWeight: 'bold',
      fontVariantNumeric: 'lining-nums tabular-nums',
    },
    helpText: {
      fontSize: 'sm',
      color: 'gray.500',
      _dark: {
        color: 'gray.400',
      },
    },
  },
  variants: {
    asset: {
      number: {
        color: 'asset.600',
        _dark: {
          color: 'asset.400',
        },
      },
    },
    liability: {
      number: {
        color: 'liability.600',
        _dark: {
          color: 'liability.400',
        },
      },
    },
    equity: {
      number: {
        color: 'equity.600',
        _dark: {
          color: 'equity.400',
        },
      },
    },
    profit: {
      number: {
        color: 'profit.600',
        _dark: {
          color: 'profit.400',
        },
      },
    },
    loss: {
      number: {
        color: 'loss.600',
        _dark: {
          color: 'loss.400',
        },
      },
    },
  },
  defaultProps: {
    variant: 'default',
  },
};

export const components = {
  Button,
  Card,
  Table,
  Badge,
  Input,
  Stat,
};
