import qz from 'qz-tray';

let connectPromise: Promise<boolean> | null = null;

/**
 * Checks if QZ Tray connection is truly open and ready to send messages.
 */
export function isQzReady(): boolean {
  try {
    const conn = (qz as any).websocket?.connection;
    return !!(
      qz.websocket.isActive() &&
      conn &&
      conn.readyState === 1 && // WebSocket.OPEN
      typeof conn.sendData === 'function'
    );
  } catch {
    return false;
  }
}

/**
 * Safely ensures a single active connection to QZ Tray without race conditions.
 */
export async function connectQzTray(): Promise<boolean> {
  if (isQzReady()) {
    return true;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    try {
      // If websocket is in closing or broken state, disconnect first
      if (qz.websocket.isActive() && !isQzReady()) {
        try {
          await qz.websocket.disconnect();
        } catch { }
      }

      if (!qz.websocket.isActive()) {
        await qz.websocket.connect({
          retries: 2,
          delay: 0.5
        });
      }

      // Wait briefly for openConnection and sendData to be ready
      for (let i = 0; i < 20; i++) {
        if (isQzReady()) {
          return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return isQzReady();
    } catch (err) {
      console.warn('QZ Tray connection error:', err);
      return false;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

/**
 * Gets the list of available printers from QZ Tray safely.
 */
export async function getQzPrinters(): Promise<string[]> {
  const connected = await connectQzTray();
  if (!connected) {
    throw new Error('Could not establish connection to QZ Tray. Make sure QZ Tray is running.');
  }
  const printers = await qz.printers.find();
  return Array.isArray(printers) ? printers : [];
}

/**
 * Prints HTML content directly via QZ Tray with standard pixel/html/plain format.
 */
export async function printHtmlViaQz(printerName: string, htmlContent: string): Promise<void> {
  const connected = await connectQzTray();
  if (!connected) {
    throw new Error('Could not establish connection to QZ Tray. Make sure QZ Tray is running.');
  }

  const config = qz.configs.create(printerName);
  const data = [
    {
      type: 'pixel',
      format: 'html',
      flavor: 'plain',
      data: htmlContent
    }
  ];

  await qz.print(config, data);
}

export default qz;
