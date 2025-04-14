// This file fixes the type issues with react-markdown
import { ComponentType, ComponentPropsWithoutRef } from 'react';

declare module 'react-markdown/lib/complex-types' {
  // Define ElementType to avoid the constraint error
  type ElementType<P = any, T extends keyof any = string> = 
    | { [K in T]: (props: P) => any }
    | ((props: P) => any);
  
  // Define IntrinsicElements to avoid JSX namespace errors
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
