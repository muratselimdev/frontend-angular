export type SpreadsheetCellValue = string | number | boolean | Date | null | undefined;

export interface SpreadsheetHeader {
  key: string;
  label: string;
}

export type SpreadsheetRow = Record<string, SpreadsheetCellValue>;

interface ZipSourceFile {
  path: string;
  content: Uint8Array;
}

interface ParsedZipEntry {
  path: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

export function exportRowsToXlsx(
  filename: string,
  sheetName: string,
  headers: SpreadsheetHeader[],
  rows: SpreadsheetRow[]
): void {
  const workbookFiles = buildWorkbookFiles(sheetName, headers, rows);
  const zipBytes = createZip(workbookFiles);
  const blob = new Blob([toArrayBuffer(zipBytes)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function readSpreadsheetRows(file: File): Promise<SpreadsheetRow[]> {
  const extension = getFileExtension(file.name);

  if (extension === 'csv' || extension === 'txt') {
    return parseDelimitedText(await file.text());
  }

  if (extension === 'xlsx') {
    return parseXlsxRows(await file.arrayBuffer());
  }

  if (extension === 'xls') {
    const text = await file.text();
    if (text.includes('\u0000')) {
      throw new Error('Bu .xls dosyası okunamıyor. Lütfen dosyayı .xlsx veya .csv olarak kaydedin.');
    }
    return parseDelimitedText(text);
  }

  throw new Error('Desteklenmeyen dosya tipi. Lütfen .xlsx, .xls veya .csv yükleyin.');
}

function buildWorkbookFiles(sheetName: string, headers: SpreadsheetHeader[], rows: SpreadsheetRow[]): ZipSourceFile[] {
  const safeSheetName = escapeXml(sheetName.slice(0, 31) || 'Sheet1');

  return [
    {
      path: '[Content_Types].xml',
      content: encodeXml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`)
    },
    {
      path: '_rels/.rels',
      content: encodeXml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`)
    },
    {
      path: 'xl/workbook.xml',
      content: encodeXml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`)
    },
    {
      path: 'xl/_rels/workbook.xml.rels',
      content: encodeXml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`)
    },
    {
      path: 'xl/styles.xml',
      content: encodeXml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1"/></cellXfs>
</styleSheet>`)
    },
    {
      path: 'xl/worksheets/sheet1.xml',
      content: encodeXml(buildWorksheetXml(headers, rows))
    }
  ];
}

function buildWorksheetXml(headers: SpreadsheetHeader[], rows: SpreadsheetRow[]): string {
  const headerCells = headers
    .map((header, index) => buildCellXml(1, index + 1, header.label, true))
    .join('');
  const bodyRows = rows
    .map((row, rowIndex) => {
      const excelRow = rowIndex + 2;
      const cells = headers
        .map((header, columnIndex) => buildCellXml(excelRow, columnIndex + 1, row[header.key], false))
        .join('');
      return `<row r="${excelRow}">${cells}</row>`;
    })
    .join('');
  const columnDefinitions = headers
    .map((_header, index) => `<col min="${index + 1}" max="${index + 1}" width="22" customWidth="1"/>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${columnDefinitions}</cols>
  <sheetData>
    <row r="1">${headerCells}</row>
    ${bodyRows}
  </sheetData>
</worksheet>`;
}

function buildCellXml(rowIndex: number, columnIndex: number, value: SpreadsheetCellValue, isHeader: boolean): string {
  const reference = `${columnName(columnIndex)}${rowIndex}`;
  const style = isHeader ? ' s="1"' : '';

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${reference}"${style}><v>${value}</v></c>`;
  }

  if (typeof value === 'boolean') {
    return `<c r="${reference}" t="b"${style}><v>${value ? 1 : 0}</v></c>`;
  }

  const text = value instanceof Date ? value.toISOString() : String(value ?? '');
  return `<c r="${reference}" t="inlineStr"${style}><is><t>${escapeXml(text)}</t></is></c>`;
}

function createZip(files: ZipSourceFile[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const fileName = encoder.encode(file.path);
    const crc = crc32(file.content);
    const localHeader = new Uint8Array(30 + fileName.length + file.content.length);

    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0x0800);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, 0);
    writeUint16(localHeader, 12, 0);
    writeUint32(localHeader, 14, crc);
    writeUint32(localHeader, 18, file.content.length);
    writeUint32(localHeader, 22, file.content.length);
    writeUint16(localHeader, 26, fileName.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(fileName, 30);
    localHeader.set(file.content, 30 + fileName.length);
    localParts.push(localHeader);

    const centralHeader = new Uint8Array(46 + fileName.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0x0800);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, 0);
    writeUint16(centralHeader, 14, 0);
    writeUint32(centralHeader, 16, crc);
    writeUint32(centralHeader, 20, file.content.length);
    writeUint32(centralHeader, 24, file.content.length);
    writeUint16(centralHeader, 28, fileName.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(fileName, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length;
  });

  const centralDirectorySize = centralParts.reduce((total, part) => total + part.length, 0);
  const endOfCentralDirectory = new Uint8Array(22);
  writeUint32(endOfCentralDirectory, 0, 0x06054b50);
  writeUint16(endOfCentralDirectory, 8, files.length);
  writeUint16(endOfCentralDirectory, 10, files.length);
  writeUint32(endOfCentralDirectory, 12, centralDirectorySize);
  writeUint32(endOfCentralDirectory, 16, offset);

  return concatBytes([...localParts, ...centralParts, endOfCentralDirectory]);
}

async function parseXlsxRows(buffer: ArrayBuffer): Promise<SpreadsheetRow[]> {
  const files = await unzip(buffer);
  const sheetPath = Array.from(files.keys()).find((path) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(path));
  const sheetBytes = sheetPath ? files.get(sheetPath) : undefined;

  if (!sheetBytes) {
    throw new Error('Excel sayfası bulunamadı.');
  }

  const sharedStrings = parseSharedStrings(files.get('xl/sharedStrings.xml'));
  const document = parseXml(decoder.decode(sheetBytes));
  const xmlRows = Array.from(document.getElementsByTagName('row'));

  if (xmlRows.length === 0) {
    return [];
  }

  const headerValues = readRowCells(xmlRows[0], sharedStrings).map((cell, index) =>
    normalizeHeaderLabel(String(cell ?? '').trim(), index)
  );

  return xmlRows.slice(1).map((row) => {
    const values = readRowCells(row, sharedStrings);
    const result: SpreadsheetRow = {};
    headerValues.forEach((header, index) => {
      result[header] = values[index] ?? '';
    });
    return result;
  });
}

async function unzip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(buffer);
  const entries = parseCentralDirectory(bytes);
  const files = new Map<string, Uint8Array>();

  for (const entry of entries) {
    const nameLength = readUint16(bytes, entry.localHeaderOffset + 26);
    const extraLength = readUint16(bytes, entry.localHeaderOffset + 28);
    const dataStart = entry.localHeaderOffset + 30 + nameLength + extraLength;
    const compressed = bytes.slice(dataStart, dataStart + entry.compressedSize);
    const content = entry.method === 0 ? compressed : await inflate(entry.method, compressed);
    files.set(entry.path, content);
  }

  return files;
}

function parseCentralDirectory(bytes: Uint8Array): ParsedZipEntry[] {
  const eocdOffset = findEndOfCentralDirectory(bytes);
  const entryCount = readUint16(bytes, eocdOffset + 10);
  const centralDirectoryOffset = readUint32(bytes, eocdOffset + 16);
  const entries: ParsedZipEntry[] = [];
  let cursor = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (readUint32(bytes, cursor) !== 0x02014b50) {
      throw new Error('Excel dosya dizini okunamadı.');
    }

    const method = readUint16(bytes, cursor + 10);
    const compressedSize = readUint32(bytes, cursor + 20);
    const fileNameLength = readUint16(bytes, cursor + 28);
    const extraLength = readUint16(bytes, cursor + 30);
    const commentLength = readUint16(bytes, cursor + 32);
    const localHeaderOffset = readUint32(bytes, cursor + 42);
    const path = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + fileNameLength));

    entries.push({ path, method, compressedSize, localHeaderOffset });
    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  for (let offset = bytes.length - 22; offset >= 0; offset -= 1) {
    if (readUint32(bytes, offset) === 0x06054b50) {
      return offset;
    }
  }

  throw new Error('Excel dosya yapısı okunamadı.');
}

async function inflate(method: number, compressed: Uint8Array): Promise<Uint8Array> {
  if (method !== 8) {
    throw new Error('Excel dosyasındaki sıkıştırma yöntemi desteklenmiyor.');
  }

  const decompressionStream = (globalThis as { DecompressionStream?: new (format: string) => TransformStream })[
    'DecompressionStream'
  ];

  if (!decompressionStream) {
    throw new Error('Bu tarayıcı Excel dosyası okumayı desteklemiyor. Lütfen CSV yükleyin.');
  }

  const stream = new Blob([toArrayBuffer(compressed)]).stream().pipeThrough(new decompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function parseSharedStrings(bytes: Uint8Array | undefined): string[] {
  if (!bytes) {
    return [];
  }

  const document = parseXml(decoder.decode(bytes));
  return Array.from(document.getElementsByTagName('si')).map((item) =>
    Array.from(item.getElementsByTagName('t'))
      .map((textNode) => textNode.textContent ?? '')
      .join('')
  );
}

function readRowCells(row: Element, sharedStrings: string[]): SpreadsheetCellValue[] {
  const cells: SpreadsheetCellValue[] = [];

  Array.from(row.getElementsByTagName('c')).forEach((cell) => {
    const reference = cell.getAttribute('r') ?? '';
    const columnIndex = getColumnIndex(reference);
    const value = readCellValue(cell, sharedStrings);
    cells[columnIndex] = value;
  });

  return cells;
}

function readCellValue(cell: Element, sharedStrings: string[]): SpreadsheetCellValue {
  const type = cell.getAttribute('t');
  const valueNode = cell.getElementsByTagName('v')[0];
  const rawValue = valueNode?.textContent ?? '';

  if (type === 's') {
    return sharedStrings[Number(rawValue)] ?? '';
  }

  if (type === 'inlineStr') {
    return Array.from(cell.getElementsByTagName('t'))
      .map((textNode) => textNode.textContent ?? '')
      .join('');
  }

  if (type === 'b') {
    return rawValue === '1';
  }

  const parsedValue = Number(rawValue);
  return rawValue.trim() !== '' && Number.isFinite(parsedValue) ? parsedValue : rawValue;
}

function parseDelimitedText(text: string): SpreadsheetRow[] {
  const rows = parseDelimitedRows(text.replace(/^\uFEFF/, ''));
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header, index) => normalizeHeaderLabel(header.trim(), index));
  return rows.slice(1).map((row) => {
    const result: SpreadsheetRow = {};
    headers.forEach((header, index) => {
      result[header] = parseDelimitedValue(row[index] ?? '');
    });
    return result;
  });
}

function parseDelimitedRows(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentCell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      currentRow.push(currentCell);
      if (currentRow.some((cell) => cell.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  if (currentRow.some((cell) => cell.trim().length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const candidates = [',', ';', '\t'];
  return candidates
    .map((delimiter) => ({
      delimiter,
      count: firstLine.split(delimiter).length
    }))
    .sort((left, right) => right.count - left.count)[0].delimiter;
}

function parseDelimitedValue(value: string): SpreadsheetCellValue {
  const normalizedValue = value.trim();
  if (normalizedValue === '') {
    return '';
  }

  const parsedNumber = Number(normalizedValue.replace(',', '.'));
  return Number.isFinite(parsedNumber) && /^-?\d+([,.]\d+)?$/.test(normalizedValue) ? parsedNumber : normalizedValue;
}

function normalizeHeaderLabel(label: string, index: number): string {
  return label.length > 0 ? label : `Column ${columnName(index + 1)}`;
}

function getColumnIndex(reference: string): number {
  const columnLetters = reference.replace(/\d/g, '').toUpperCase();
  let value = 0;

  for (const letter of columnLetters) {
    value = value * 26 + letter.charCodeAt(0) - 64;
  }

  return Math.max(value - 1, 0);
}

function columnName(index: number): string {
  let value = index;
  let name = '';

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
}

function parseXml(value: string): Document {
  const document = new DOMParser().parseFromString(value, 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Excel XML içeriği okunamadı.');
  }
  return document;
}

function encodeXml(value: string): Uint8Array {
  return encoder.encode(value);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getFileExtension(filename: string): string {
  const extension = filename.split('.').pop();
  return extension ? extension.toLowerCase() : '';
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });

  return output;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function writeUint16(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function readUint16(target: Uint8Array, offset: number): number {
  return target[offset] | (target[offset + 1] << 8);
}

function readUint32(target: Uint8Array, offset: number): number {
  return (
    target[offset] |
    (target[offset + 1] << 8) |
    (target[offset + 2] << 16) |
    (target[offset + 3] << 24)
  ) >>> 0;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}

const crcTable = (() => {
  const table: number[] = [];

  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
})();
