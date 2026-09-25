// Try importing the button types directly with relative path
import type { ButtonProps } from '../../node_modules/@chakra-ui/react/dist/types/button/button.d.ts';

// This is just for type testing - we won't actually render this
const test: ButtonProps = {
  children: 'Test',
  variant: 'primary'
};

export default function Test() {
  return null;
}