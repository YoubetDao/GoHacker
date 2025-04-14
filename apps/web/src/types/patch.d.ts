// This file patches problematic type definitions in node_modules

// Fix for react-markdown
declare module 'react-markdown/lib/complex-types' {
  // Provide simplified types that won't cause errors
  export type NormalComponents = Record<string, any>;
  export type SpecialComponents = Record<string, any>;
  export type Components = Record<string, any>;
}
