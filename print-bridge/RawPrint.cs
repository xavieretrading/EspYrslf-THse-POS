// print-bridge/RawPrint.cs
// High-performance Win32 raw printing utility for ESC/POS thermal printers

using System;
using System.IO;
using System.Drawing.Printing;
using System.Runtime.InteropServices;

namespace POSPrintBridge {
    public class RawPrinterHelper {
        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
        public class DOCINFOA {
            [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
            [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
            [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
        }

        [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

        [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool ClosePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

        [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool EndDocPrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool StartPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool EndPagePrinter(IntPtr hPrinter);

        [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
        public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

        public static bool SendFileToPrinter(string szPrinterName, string szFileName) {
            byte[] bytes = File.ReadAllBytes(szFileName);
            return SendBytesToPrinter(szPrinterName, bytes);
        }

        public static bool SendBytesToPrinter(string szPrinterName, byte[] pBytes) {
            IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(pBytes.Length);
            Marshal.Copy(pBytes, 0, pUnmanagedBytes, pBytes.Length);
            IntPtr hPrinter = IntPtr.Zero;
            DOCINFOA di = new DOCINFOA();
            di.pDocName = "POS Receipt";
            di.pDataType = "RAW";

            bool bSuccess = false;
            try {
                if (OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero)) {
                    if (StartDocPrinter(hPrinter, 1, di)) {
                        if (StartPagePrinter(hPrinter)) {
                            Int32 dwWritten = 0;
                            bSuccess = WritePrinter(hPrinter, pUnmanagedBytes, pBytes.Length, out dwWritten);
                            EndPagePrinter(hPrinter);
                        }
                        EndDocPrinter(hPrinter);
                    }
                    ClosePrinter(hPrinter);
                } else {
                    int err = Marshal.GetLastWin32Error();
                    Console.Error.WriteLine("OpenPrinter failed with Win32 error code: " + err);
                }
            } catch (Exception ex) {
                Console.Error.WriteLine("Print exception: " + ex.Message);
            } finally {
                Marshal.FreeCoTaskMem(pUnmanagedBytes);
            }
            return bSuccess;
        }

        public static void ListPrinters() {
            try {
                foreach (string printer in PrinterSettings.InstalledPrinters) {
                    Console.WriteLine(printer);
                }
            } catch (Exception ex) {
                Console.Error.WriteLine("Error listing printers: " + ex.Message);
            }
        }

        public static int Main(string[] args) {
            if (args.Length == 0) {
                Console.WriteLine("Usage: RawPrint.exe list");
                Console.WriteLine("       RawPrint.exe print <PrinterName> <RawFilePath>");
                return 1;
            }

            string command = args[0].ToLower();
            if (command == "list") {
                ListPrinters();
                return 0;
            } else if (command == "print") {
                if (args.Length < 3) {
                    Console.Error.WriteLine("Missing printer name or file path.");
                    return 2;
                }
                string printerName = args[1];
                string filePath = args[2];

                if (!File.Exists(filePath)) {
                    Console.Error.WriteLine("File not found: " + filePath);
                    return 3;
                }

                bool success = SendFileToPrinter(printerName, filePath);
                if (success) {
                    Console.WriteLine("PRINT_SUCCESS");
                    return 0;
                } else {
                    Console.Error.WriteLine("PRINT_FAILED");
                    return 4;
                }
            } else {
                Console.Error.WriteLine("Unknown command: " + command);
                return 1;
            }
        }
    }
}
