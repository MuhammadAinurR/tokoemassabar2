interface PrintLabelParams {
  name: string;
  code: string;
  tkr: string;
  weight: number;
}

export const printLabel = async (params: PrintLabelParams): Promise<void> => {
  const printWindow = document.createElement("iframe");
  printWindow.style.display = "none";
  document.body.appendChild(printWindow);

  const printContent = `
<!DOCTYPE html>
<html>
    <head>
        <title>Label Print</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
        <style>
            body {
                margin: 0;
                margin-top: 0.5mm;
                padding: 0;
                font-family: "Consolas", "Courier", monospace;
                font-size: 8pt;
            }
            .content {
                padding: 2px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                height: 12mm;
                margin-left: 29mm;
                margin-top: 0.5mm;
            }
            .label-info {

                margin-top: 0.5mm;
                text-align: left;
                line-height: 1.3;
                margin-left: 4.5mm;
                font-size: 10.5pt;
                font-weight: bold;
            }
            .label-info div {
                margin-bottom: 1.2mm;
            }
            .barcode {
                text-align: right;
                height: 100%;
                position: fixed;
                right: 2mm;
                top: 2mm;
            }
            .barcode-canvas {
                height: 10mm;
                width: 20mm;
            }
            .barcode canvas {
                height: 10mm !important;
                width: 20mm !important;
            }
            @media print {
                body {
                    width: 75mm;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                @page {
                    margin-top: 0;
                    margin-bottom: 0;
                    margin-left: 30mm;
                    margin-right: 0;
                    size: 75mm 12mm;
                }
            }
        </style>
    </head>
    <body>
        <div class="content">
            <div class="label-info">
                <div>${params.code}</div>
                <div>${params.weight} G|${params.tkr}</div>
            </div>
            <div class="barcode">
                <canvas id="barcode"></canvas>
            </div>
        </div>
        <script>
            window.onload = function() {
                JsBarcode("#barcode", "${params.code}", {
                    format: "CODE128",
                    width: 1,
                    height: 38,
                    displayValue: false,
                    margin: 0,
                    lineColor: "#000",
                    background: "#fff"
                });
                
                setTimeout(() => {
                    window.print();
                    window.onafterprint = function() {
                        window.frameElement.remove();
                    };
                }, 500);
            };
        </script>
    </body>
</html>`;

  const doc = printWindow.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(printContent);
    doc.close();
  } else {
    throw new Error("Unable to create iframe document");
  }
};
