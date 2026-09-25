// Try importing the button types directly
import type { ButtonProps } from '@/node_modules/@chakra-ui/react/dist/types/button/button-types';

// This is just for type testing - we won't actually render this
const test: ButtonProps = {
  children: 'Test',
  variant: 'primary'
};

export default function Test() {
  return null;
}