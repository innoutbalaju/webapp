import type { PrinterEndpoint, PrinterSupport } from '@/types/domain';

export type WebUsbDevice = {
  configuration: {
    configurationValue: number;
    interfaces: Array<{
      interfaceNumber: number;
      alternates: Array<{
        endpoints: Array<{
          endpointNumber: number;
          direction: 'in' | 'out';
        }>;
      }>;
    }>;
  } | null;
  configurations?: Array<{
    configurationValue: number;
    interfaces: Array<{
      interfaceNumber: number;
      alternates: Array<{
        endpoints: Array<{
          endpointNumber: number;
          direction: 'in' | 'out';
        }>;
      }>;
    }>;
  }>;
  open: () => Promise<void>;
  selectConfiguration: (configurationValue: number) => Promise<void>;
  claimInterface: (interfaceNumber: number) => Promise<void>;
  transferOut: (endpointNumber: number, data: BufferSource) => Promise<unknown>;
};

type WebUsbNavigator = Navigator & {
  usb?: {
    requestDevice(options: {
      filters?: Array<Record<string, unknown>>;
    }): Promise<WebUsbDevice>;
  };
};

function getUsbEndpoint(device: WebUsbDevice): PrinterEndpoint | null {
  const configuration = device.configuration ?? device.configurations?.[0];

  if (!configuration) {
    return null;
  }

  for (const iface of configuration.interfaces) {
    for (const alternate of iface.alternates) {
      const outEndpoint = alternate.endpoints.find(
        (endpoint) => endpoint.direction === 'out',
      );

      if (outEndpoint) {
        return {
          configurationValue: configuration.configurationValue,
          interfaceNumber: iface.interfaceNumber,
          endpointNumber: outEndpoint.endpointNumber,
        };
      }
    }
  }

  return null;
}

export function getPrinterSupport(): PrinterSupport {
  const browserNavigator = navigator as WebUsbNavigator;

  if (typeof navigator === 'undefined' || !browserNavigator.usb) {
    return {
      isSupported: false,
      message:
        'WebUSB auto-printing requires Google Chrome or Microsoft Edge.',
    };
  }

  return {
    isSupported: true,
    message: null,
  };
}

export async function requestPrinterDevice() {
  const browserNavigator = navigator as WebUsbNavigator;

  if (!browserNavigator.usb) {
    throw new Error(
      'WebUSB auto-printing requires Google Chrome or Microsoft Edge.',
    );
  }

  return browserNavigator.usb.requestDevice({
    filters: [{}],
  });
}

export async function printBytes(device: WebUsbDevice, bytes: Uint8Array) {
  const endpoint = getUsbEndpoint(device);

  if (!endpoint) {
    throw new Error('Unable to find a writable USB endpoint on this printer.');
  }

  await device.open();

  if (!device.configuration) {
    await device.selectConfiguration(endpoint.configurationValue);
  }

  await device.claimInterface(endpoint.interfaceNumber);
  await device.transferOut(endpoint.endpointNumber, bytes);
}
