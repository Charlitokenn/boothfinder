"use client"

import React from "react"
import {
  Button,
  DatePicker,
  Dialog,
  Group,
  Label,
  Popover,
} from "react-aria-components"
import { CalendarIcon } from "lucide-react"
import { DateInput } from "./datefield-rac"
import { cn } from "../../lib/utils"
import { Calendar } from "./calendar"

type DatePickerInputProps = {
  label?: string
  icon?: React.ReactNode
  className?: string
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label = "Date picker",
  icon,
  className,
}) => {
  const finalIcon = icon ?? <CalendarIcon size={16} />

  return (
    <DatePicker className={cn("*:not-first:mt-2", className)}>
      <div className="flex">
        <Group className="w-full">
          <DateInput className="pe-9" />
        </Group>
        <Button className="text-muted-foreground/80 cursor-pointer hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-ring/50 z-10 -ms-9 -me-px flex w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none data-focus-visible:ring-[3px]">
          {finalIcon}
        </Button>
      </div>
      <Popover
        className={cn(
          "bg-background text-popover-foreground data-entering:animate-in data-exiting:animate-out data-[entering]:fade-in-0 data-[exiting]:fade-out-0 data-[entering]:zoom-in-95 data-[exiting]:zoom-out-95",
          "data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2",
          "z-50 rounded-lg border shadow-lg outline-hidden"
        )}
        offset={4}
      >
        <Dialog className="max-h-[inherit] overflow-auto p-2">
          <Calendar 
            mode="single"
          />
        </Dialog>
      </Popover>
    </DatePicker>
  )
}
