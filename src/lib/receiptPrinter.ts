export const RECEIPT_PRINT_STYLES = `
  @page { 
    size: 80mm auto; 
    margin: 0; 
  }
  html, body { 
    margin: 0 !important; 
    padding: 0 !important;
    background-color: #ffffff !important;
    background: #ffffff !important;
    color: #000000 !important;
    width: 80mm !important;
    max-width: 80mm !important;
    font-family: Arial, Helvetica, sans-serif !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .receipt-ticket-content { 
    width: 80mm !important; 
    max-width: 80mm !important; 
    margin: 0 auto !important; 
    padding: 6px !important; 
    background: #ffffff !important;
    box-sizing: border-box !important;
    color: #000000 !important;
  }
  .receipt-ticket-content * {
    font-size: 9.5pt !important; 
    line-height: 1.25 !important; 
    color: #000000 !important;
    font-family: Arial, Helvetica, sans-serif !important;
    font-weight: 400 !important;
    box-sizing: border-box !important;
  }
  .receipt-ticket-content p, .receipt-ticket-content div, .receipt-ticket-content span {
    margin: 0 !important;
    padding: 0 !important;
  }
  .receipt-ticket-content .row-item {
    margin-top: 2.5px !important;
    margin-bottom: 2.5px !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
  }
  .receipt-ticket-content .section-block {
    margin-top: 5px !important;
    margin-bottom: 5px !important;
  }
  .receipt-ticket-content .section-header {
    font-size: 10.5pt !important;
    font-weight: 700 !important;
    border-top: 1px dashed black !important;
    border-bottom: 1px dashed black !important;
    padding-top: 3px !important;
    padding-bottom: 3px !important;
    margin-top: 6px !important;
    margin-bottom: 6px !important;
    text-align: center !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
  }
  .receipt-ticket-content .receipt-logo {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    max-height: none !important;
    display: block !important;
    margin: 0 auto 6px auto !important;
    object-fit: contain !important;
  }
  .receipt-ticket-content .company-name {
    font-size: 11.5pt !important;
    font-weight: 700 !important;
    display: block !important;
    text-align: center !important;
    text-transform: uppercase !important;
    margin-bottom: 2px !important;
  }
  .receipt-ticket-content .receipt-title {
    font-size: 10.5pt !important;
    font-weight: 700 !important;
    display: block !important;
    text-align: center !important;
    text-transform: uppercase !important;
    margin-bottom: 2px !important;
  }
  .receipt-ticket-content .print-total,
  .receipt-ticket-content .print-total * {
    font-size: 13pt !important;
    font-weight: 700 !important;
    line-height: 1.4 !important;
  }
  .receipt-ticket-content .print-change,
  .receipt-ticket-content .print-change * {
    font-size: 11.5pt !important;
    font-weight: 700 !important;
    line-height: 1.3 !important;
  }
  .receipt-ticket-content .font-bold,
  .receipt-ticket-content .font-black,
  .receipt-ticket-content .font-semibold,
  .receipt-ticket-content .print-bold-text {
    font-weight: 700 !important;
  }
  .text-center { text-align: center !important; }
  .text-right { text-align: right !important; }
  .border-t { border-top: 1px dashed black !important; }
  .border-b { border-bottom: 1px solid black !important; }
  .border-y { border-top: 1px dashed black !important; border-bottom: 1px dashed black !important; }
  .italic { font-style: italic !important; }
  .truncate { overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
  .print\\:hidden, .print-hidden { display: none !important; }
`;

/**
 * Prints receipt content using an isolated hidden iframe.
 * This completely avoids parent modal clipping, backdrop-blur interference,
 * and blank page rendering in Chrome/Edge/Firefox.
 */
export function printReceiptViaBrowser(targetElementOrHtml?: HTMLElement | string | null): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      let contentHtml = '';
      if (typeof targetElementOrHtml === 'string') {
        contentHtml = targetElementOrHtml;
      } else if (targetElementOrHtml instanceof HTMLElement) {
        contentHtml = targetElementOrHtml.innerHTML;
      } else {
        // Find all receipt-ticket-content elements in the DOM
        const elements = document.querySelectorAll('.receipt-ticket-content');
        if (elements.length > 0) {
          contentHtml = Array.from(elements).map(el => el.outerHTML).join('<div style="border-top:1px dashed black; margin:16px 0;"></div>');
        } else {
          const printArea = document.querySelector('.printable-area');
          if (printArea) {
            contentHtml = printArea.innerHTML;
          }
        }
      }

      if (!contentHtml.trim()) {
        console.warn('No receipt content found to print. Falling back to window.print()');
        window.print();
        resolve(false);
        return;
      }

      // Remove existing print iframe if any
      let iframe = document.getElementById('receipt-print-iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.remove();
      }

      iframe = document.createElement('iframe');
      iframe.id = 'receipt-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-9999';

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        window.print();
        resolve(false);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Receipt</title>
            <style>${RECEIPT_PRINT_STYLES}</style>
          </head>
          <body>
            <div class="receipt-ticket-content">
              ${contentHtml}
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();

      // Ensure all images are loaded inside iframe before printing
      const triggerPrint = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            resolve(true);
          } catch (err) {
            console.error('Error invoking iframe.print():', err);
            window.print();
            resolve(false);
          }
        }, 150);
      };

      const imgs = iframeDoc.querySelectorAll('img');
      if (imgs.length === 0) {
        triggerPrint();
      } else {
        let loaded = 0;
        const total = imgs.length;
        const onImgDone = () => {
          loaded++;
          if (loaded >= total) {
            triggerPrint();
          }
        };

        imgs.forEach((img) => {
          if (img.complete) {
            onImgDone();
          } else {
            img.onload = onImgDone;
            img.onerror = onImgDone;
          }
        });

        // Safety timeout in case image never fires onload
        setTimeout(triggerPrint, 400);
      }
    } catch (err) {
      console.error('printReceiptViaBrowser unexpected error:', err);
      window.print();
      resolve(false);
    }
  });
}
