// Global type declarations to fix JSX namespace issues
import React from 'react';

// Add JSX namespace to global scope
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
