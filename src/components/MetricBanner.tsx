import React from 'react';

interface MetricBannerProps {
  dateStr: string;
  totalItems: number;
  stockInToday: number;
  stockOutToday: number;
  currency?: string;
  onRefresh?: () => void;
}

export const MetricBanner: React.FC<MetricBannerProps> = ({
  dateStr,
  totalItems,
  stockInToday,
  stockOutToday,
}) => {
  return (
    <div className="mx-4 mt-3 p-5 rounded-2xl bg-[#4965fa] text-white shadow-md shadow-blue-500/15 relative overflow-hidden">
      {/* Header with pagination dots */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline space-x-2">
          <h2 className="text-xl font-bold tracking-tight">Today</h2>
          <span className="text-sm font-normal text-blue-100">{dateStr}</span>
        </div>
        <div className="flex space-x-1.5 items-center">
          <div className="w-2 h-2 rounded-full bg-white opacity-90"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-40"></div>
        </div>
      </div>

      {/* 3 Metric Columns */}
      <div className="grid grid-cols-3 gap-2 text-left pt-1">
        <div>
          <div className="text-3xl font-extrabold tracking-tight">{totalItems}</div>
          <div className="text-xs font-medium text-blue-100 mt-0.5">Total</div>
        </div>

        <div>
          <div className="text-3xl font-extrabold tracking-tight">{stockInToday}</div>
          <div className="text-xs font-medium text-blue-100 mt-0.5">Stock In</div>
        </div>

        <div>
          <div className="text-3xl font-extrabold tracking-tight">{stockOutToday}</div>
          <div className="text-xs font-medium text-blue-100 mt-0.5">Stock Out</div>
        </div>
      </div>
    </div>
  );
};
