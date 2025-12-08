"use client";
import React from 'react';
import * as Select from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';

// Định nghĩa kiểu dữ liệu đầu vào
interface SelectBoxProps {
  icon?: React.ReactNode; // Icon bên trái (ví dụ: cái ghim đỏ)
  placeholder: string;    // Chữ mờ khi chưa chọn gì
  options: { value: string; label: string }[]; // Danh sách các lựa chọn
}

const SelectBox = ({ icon, placeholder, options }: SelectBoxProps) => (
  <Select.Root>
    {/* Cái nút bấm để mở dropdown */}
    <Select.Trigger className="
      flex items-center justify-between 
      w-[250px] h-12 px-4 
      bg-white border-r border-gray-200 
      text-gray-700 text-sm font-medium 
      hover:bg-gray-50 transition outline-none
      /* Sửa lại border cho responsive */
      border-b md:border-b-0 md:border-r
    ">
      <div className="flex items-center gap-2">
        {icon && <span className="text-[#D51F35]">{icon}</span>}
        <Select.Value placeholder={placeholder} />
      </div>
      <Select.Icon>
        <ChevronDownIcon className="text-gray-400" />
      </Select.Icon>
    </Select.Trigger>

    {/* Phần danh sách xổ xuống */}
    <Select.Portal>
      <Select.Content className="
        overflow-hidden bg-white rounded-lg shadow-lg border border-gray-100
        mt-2 z-50 /* Đảm bảo nó nổi lên trên cùng */
      ">
        <Select.Viewport className="p-2">
          {options.map((option) => (
            <Select.Item
              key={option.value}
              value={option.value}
              className="
                relative flex items-center h-10 px-8 rounded-md text-sm text-gray-700 font-medium
                select-none outline-none cursor-pointer
                data-highlighted:bg-red-50 data-highlighted:text-[#D51F35] transition-colors
              "
            >
              <Select.ItemText>{option.label}</Select.ItemText>
              <Select.ItemIndicator className="absolute left-2 inline-flex items-center justify-center text-[#D51F35]">
                <CheckIcon />
              </Select.ItemIndicator>
            </Select.Item>
          ))}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
);

export default SelectBox;