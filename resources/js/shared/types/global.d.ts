// Global ambient type declarations for modules missing type declarations
declare module 'solid-js' {
  export * from 'solid-js/web';
}

declare module 'svelte/store' {
  export * from 'svelte/store';
}

declare module 'vue-demi' {
  export * from 'vue';
}

declare module 'vue' {
  // Vue type definitions are complex; we declare it as any for now to avoid errors
  // In a real project, you might want to install @types/vue or use the official Vue 3 types
  export type ComponentPublicInstance = any;
  export type DefineComponent = any;
  export * from 'vue';
}

// Augment the global scope
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }

  // Laravel Ziggy route helper
  function route(
    name: string,
    parameters?: Record<string, any> | string[] | number | string,
    absolute?: boolean | string
  ): string;
}

export {};