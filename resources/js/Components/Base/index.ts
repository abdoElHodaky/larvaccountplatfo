/**
 * Base Components Index
 * Performance-optimized foundational components using React.Fragment and memoization
 */

export { default as AppLayout } from './AppLayout';
export { 
  default as Container, 
  FinancialContainer, 
  CardContainer 
} from './Container';
export { 
  default as Section, 
  FinancialSection, 
  CardSection, 
  BorderedSection, 
  SectionGroup 
} from './Section';

// Type exports
export type { default as AppLayoutProps } from './AppLayout';
export type { default as ContainerProps } from './Container';
export type { default as SectionProps } from './Section';
