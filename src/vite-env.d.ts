/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_HOTEL_NAME?: string;
  readonly VITE_ADMIN_SUPPORT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface USBEndpoint {
    endpointNumber: number;
    direction: 'in' | 'out';
  }

  interface USBAlternateInterface {
    endpoints: USBEndpoint[];
  }

  interface USBInterface {
    interfaceNumber: number;
    alternates: USBAlternateInterface[];
  }

  interface USBConfiguration {
    configurationValue: number;
    interfaces: USBInterface[];
  }

  interface USBDevice {
    configuration: USBConfiguration | null;
    configurations?: USBConfiguration[];
    open: () => Promise<void>;
    selectConfiguration: (configurationValue: number) => Promise<void>;
    claimInterface: (interfaceNumber: number) => Promise<void>;
    transferOut: (endpointNumber: number, data: BufferSource) => Promise<unknown>;
  }

  interface USB {
    requestDevice(options: {
      filters?: Array<Record<string, unknown>>;
    }): Promise<USBDevice>;
  }

  interface Navigator {
    usb?: USB;
  }
}
