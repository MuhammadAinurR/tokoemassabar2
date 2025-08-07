export const numberToWords = (num: number): string => {
  const units = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];
  const scales = ['', 'Ribu', 'Juta', 'Milyar', 'Triliun'];

  if (num === 0) return 'Nol Rupiah';

  const convertGroup = (n: number): string => {
    if (n === 0) return '';

    if (n < 12) return units[n];

    if (n < 20) return `${units[n % 10]} Belas`;

    if (n < 100) {
      const unit = n % 10;
      return `${units[Math.floor(n / 10)]} Puluh ${unit ? units[unit] : ''}`.trim();
    }

    if (n < 1000) {
      const remainder = n % 100;
      const hundreds = Math.floor(n / 100);
      return `${hundreds === 1 ? 'Seratus' : `${units[hundreds]} Ratus`} ${convertGroup(remainder)}`.trim();
    }

    return '';
  };

  let result = '';
  let remaining = num;
  let groupIndex = 0;

  while (remaining > 0) {
    const group = remaining % 1000;
    if (group > 0) {
      const groupText = convertGroup(group);
      const scaleText = scales[groupIndex];
      result = `${groupText}${scaleText ? ' ' + scaleText : ''} ${result}`;
    }
    remaining = Math.floor(remaining / 1000);
    groupIndex++;
  }

  return `${result.trim()} Rupiah`;
};
