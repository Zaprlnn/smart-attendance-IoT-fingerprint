export interface ExcelColumn<T> {
  header: string
  width: number
  value: (row: T) => string | number
  align?: "left" | "center" | "right"
}

interface ExportToExcelOptions<T> {
  filename: string
  sheetName: string
  title: string
  subtitle?: string
  columns: ExcelColumn<T>[]
  rows: T[]
}

const BRAND_TEAL = "FF3BC1A8"
const BRAND_NAVY = "FF0F2A3F"

/** Builds a styled .xlsx (title banner, bold header row, frozen header, zebra
 * rows) from in-memory data and triggers a browser download. ExcelJS is
 * imported dynamically so it never inflates the initial page bundle. */
export async function exportRowsToExcel<T>({
  filename,
  sheetName,
  title,
  subtitle,
  columns,
  rows,
}: ExportToExcelOptions<T>): Promise<void> {
  const ExcelJS = (await import("exceljs")).default
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "Smart Attendance UAD"
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 4 }],
  })

  sheet.columns = columns.map((col) => ({ width: col.width }))

  const titleRow = sheet.addRow([title])
  sheet.mergeCells(1, 1, 1, columns.length)
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: BRAND_NAVY } }
  titleRow.height = 22

  if (subtitle) {
    const subtitleRow = sheet.addRow([subtitle])
    sheet.mergeCells(2, 1, 2, columns.length)
    subtitleRow.getCell(1).font = { size: 10, color: { argb: "FF5C6F76" } }
  } else {
    sheet.addRow([])
  }

  sheet.addRow([])

  const headerRow = sheet.addRow(columns.map((col) => col.header))
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_TEAL } }
    cell.alignment = { vertical: "middle", horizontal: "center" }
    cell.border = {
      top: { style: "thin", color: { argb: "FFD9E5E2" } },
      bottom: { style: "thin", color: { argb: "FFD9E5E2" } },
    }
  })
  headerRow.height = 20

  rows.forEach((row, index) => {
    const dataRow = sheet.addRow(columns.map((col) => col.value(row)))
    const isEven = index % 2 === 0
    dataRow.eachCell((cell, colNumber) => {
      const align = columns[colNumber - 1]?.align ?? "left"
      cell.alignment = { vertical: "middle", horizontal: align }
      if (isEven) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F8F7" } }
      }
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFEFF2F1" } },
      }
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
