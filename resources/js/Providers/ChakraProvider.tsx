import React from 'react';
import { ChakraProvider as BaseChakraProvider, ColorModeScript } from '@chakra-ui/react';
import theme from '@/theme';

/**
 * Chakra UI Provider Component
 * Wraps the application with Chakra UI theme and color mode support
 */

interface ChakraProviderProps {
  children: React.ReactNode;
}

export const ChakraProvider: React.FC<ChakraProviderProps> = React.memo(({ children }) => {
  return (
    <>
      {/* Color mode script for preventing flash of wrong theme */}
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      
      <BaseChakraProvider theme={theme} resetCSS={false}>
        {children}
      </BaseChakraProvider>
    </>
  );
});

ChakraProvider.displayName = 'ChakraProvider';

export default ChakraProvider;
