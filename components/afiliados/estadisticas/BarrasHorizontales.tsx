"use client";

export type BarraHorizontalItem = {
  name: string;
  value: number;
  color?: string;
};

type Props = {
  items: BarraHorizontalItem[];
  total: number;
  labelColumna?: string;
  accentColor?: string;
  emptyLabel?: string;
  maxHeightClass?: string;
};

export default function BarrasHorizontales({
  items,
  total,
  labelColumna = "Categoría",
  accentColor = "#6366f1",
  emptyLabel = "Sin registros",
  maxHeightClass = "max-h-[min(60vh,640px)]",
}: Props) {
  const maxValue = items.length > 0 ? Math.max(...items.map((i) => i.value), 1) : 1;

  return (
    <div
      className={`flex-1 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/50 dark:border-neutral-800 dark:bg-neutral-900/40 ${maxHeightClass}`}
    >
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col />
          <col className="w-[3.5rem]" />
          <col className="w-[3rem]" />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-200 dark:border-neutral-700">
            <th className="px-3 pb-2 pt-2 text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-neutral-400 md:text-[10px]">
              {labelColumna}
            </th>
            <th className="px-3 pb-2 pt-2 text-right text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-neutral-400 md:text-[10px]">
              Cant.
            </th>
            <th className="px-3 pb-2 pt-2 text-right text-[9px] font-bold uppercase tracking-wide text-gray-500 dark:text-neutral-400 md:text-[10px]">
              %
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="px-3 py-6 text-center text-[10px] font-semibold uppercase text-gray-400 dark:text-neutral-500"
              >
                {emptyLabel}
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const color = item.color ?? accentColor;
              const pctNum = total > 0 ? (item.value / total) * 100 : 0;
              const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

              return (
                <tr
                  key={item.name}
                  className="group cursor-default border-b border-gray-100 last:border-0 dark:border-neutral-800"
                >
                  <td colSpan={3} className="relative p-0">
                    <div className="absolute inset-0 bg-transparent transition-colors duration-200 group-hover:bg-gray-50 dark:group-hover:bg-neutral-800/40" />
                    <div className="relative px-3 py-2.5">
                      <div className="mb-2 grid grid-cols-[1fr_3.5rem_3rem] items-center gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <span
                            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate text-[9px] font-bold uppercase leading-snug text-gray-700 group-hover:text-gray-900 dark:text-neutral-300 dark:group-hover:text-neutral-100 md:text-[10px]">
                            {item.name}
                          </span>
                        </div>
                        <span
                          className="text-right text-xs font-black tabular-nums md:text-sm"
                          style={{ color }}
                        >
                          {item.value}
                        </span>
                        <span className="text-right text-[10px] font-semibold tabular-nums text-gray-500 dark:text-neutral-400 md:text-xs">
                          {pctNum.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
                        <div
                          className="h-full rounded-full transition-[width] duration-500 ease-out"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
