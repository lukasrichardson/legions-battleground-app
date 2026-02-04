import { ReactElement } from "react";

const tableRow = (children: ReactElement | string, index?: number) => (
  <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition-colors">
    {children}
  </tr>
)

const tableHeader = (children: ReactElement | string, index: number) => (
  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" key={index}>
    {children}
  </th>
)

const renderTableData = (children: ReactElement | string, index: number) => (
  <td className="px-3 py-2 text-xs text-white" key={index}>
    {children}
  </td>
)

export default function Table({ tableHeaders, tableData }: { tableHeaders: string[], tableData: (ReactElement | string)[][] }) {
  return (
    <div className="w-full">
      <table className="w-full">
        <thead className="bg-white/5">
          <tr>
            {tableHeaders.map((header, index) => tableHeader(header, index))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((dataRow, index) => (
            tableRow(
              <>
                {dataRow.map((data, index) => renderTableData(data, index))}
              </>,
              index
            )
          ))}
        </tbody>
      </table>
    </div>
  )
}