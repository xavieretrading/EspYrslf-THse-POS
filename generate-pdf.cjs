const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// Create a document
const doc = new PDFDocument({ margin: 50 });

// Pipe its output somewhere, like to a file or HTTP response
doc.pipe(fs.createWriteStream(path.join(publicDir, 'AllSet-POS-User-Manual.pdf')));

// Fonts and Styling
const defaultFont = 'Helvetica';
const boldFont = 'Helvetica-Bold';
const titleSize = 24;
const headerSize = 16;
const subHeaderSize = 12;
const normalSize = 10;

// Add a Title
doc.font(boldFont).fontSize(titleSize).text('AllSet POS - User Manual', { align: 'center' });
doc.moveDown(2);

// Introduction
doc.font(boldFont).fontSize(headerSize).text('1. Introduction');
doc.font(defaultFont).fontSize(normalSize).text('Welcome to the AllSet POS system. This manual provides a comprehensive guide to using all the features of the point-of-sale application.');
doc.moveDown(1);

// 2. Login
doc.font(boldFont).fontSize(headerSize).text('2. Login');
doc.font(defaultFont).fontSize(normalSize).text('To access the system, open the application URL in your browser. Enter your registered email and password on the login screen. If you are logging in for development purposes, you may use the default credentials configured in your settings.');
doc.moveDown(1);

// 3. Point of Sale (POS)
doc.font(boldFont).fontSize(headerSize).text('3. Point of Sale (POS)');
doc.font(defaultFont).fontSize(normalSize).text('The POS module is the core feature for ringing up sales. It includes:');
doc.list([
  'Categories: Tap or click categories to filter products.',
  'Products: Browse and add items to the cart.',
  'Cart: Review the selected items, update quantities, or remove them.',
  'Checkout: Choose a payment method, apply taxes or discounts, and process the transaction.',
  'Receipt Generation: After a successful transaction, a digital receipt can be previewed or printed.'
]);
doc.moveDown(1);

// 4. Orders Management
doc.font(boldFont).fontSize(headerSize).text('4. Orders Management');
doc.font(defaultFont).fontSize(normalSize).text('Manage ongoing and past orders via the "Orders" module.');
doc.list([
  'Active Orders: View orders that are currently pending, cooking, or unpaid.',
  'Order History: Search and review completed, voided, or refunded orders.',
  'Actions: From the history view, authorized users may issue refunds or void orders.'
]);
doc.moveDown(1);

// 5. Kitchen Display System (KDS)
doc.font(boldFont).fontSize(headerSize).text('5. Kitchen Display System (KDS)');
doc.font(defaultFont).fontSize(normalSize).text('Designed for the kitchen staff to track preparation workflows.');
doc.list([
  'Incoming Orders: Items show up automatically when ordered from the POS.',
  'Status Updates: Mark items as "Cooking" or "Ready" to coordinate with front-of-house staff.'
]);
doc.moveDown(1);

// 6. Reports
doc.font(boldFont).fontSize(headerSize).text('6. Reports');
doc.font(defaultFont).fontSize(normalSize).text('Essential for business tracking and compliance.');
doc.list([
  'Sales Reports: Generate summaries of sales, gross income, discounts, and net totals.',
  'Filters: View data based on specific dates or branches.',
  'Print/Export: Print the generated reports to save physical or digital records.'
]);
doc.moveDown(1);

// 7. Settings
doc.font(boldFont).fontSize(headerSize).text('7. System Settings');
doc.font(defaultFont).fontSize(normalSize).text('Administrators can configure the core operations of the application:');
doc.list([
  'General Config: Update Company Name (default: AllSet Pos), Tax identification, address, and receipt texts.',
  'Inventory / Products: Add or edit items, manage pricing, and stock levels.',
  'Users: Create and define roles/permissions for staff members.',
  'Hardware: Configure pos terminals and connection details.'
]);
doc.moveDown(1);

// Conclusion
doc.font(defaultFont).fontSize(normalSize).text('This concludes the primary user instructions. For further customization or advanced modules, please consult your system administrator.');

// Finalize PDF file
doc.end();

console.log('PDF User Manual generated successfully in public/AllSet-POS-User-Manual.pdf');
