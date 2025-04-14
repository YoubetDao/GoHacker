// Custom type declarations for react-markdown to fix JSX namespace issues
import { ComponentType, ComponentPropsWithoutRef } from 'react';
import { ElementType } from 'react';

declare module 'react-markdown' {
  export interface ReactMarkdownProps {
    // Add any props that might be missing
    children?: string;
    components?: Record<string, ComponentType<any>>;
  }

  // Define the missing JSX namespace
  namespace JSX {
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}
