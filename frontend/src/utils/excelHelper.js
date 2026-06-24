import * as XLSX from 'xlsx';

/**
 * Exports a JSON array to an Excel file.
 * @param {Array} data - The array of objects to export.
 * @param {string} fileName - The name of the downloaded file.
 * @param {string} sheetName - The sheet tab name inside Excel.
 */
export const exportToExcel = (data, fileName = 'export', sheetName = 'Data') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

/**
 * Parses an uploaded Excel file and returns a promise resolving to a JSON array.
 * @param {File} file - The file object from file input.
 * @returns {Promise<Array>}
 */
export const importFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(new Error('Failed to parse Excel file. Ensure it is a valid .xlsx or .xls file.'));
      }
    };
    reader.onerror = () => reject(new Error('File reading error.'));
    reader.readAsArrayBuffer(file);
  });
};
