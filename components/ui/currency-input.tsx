"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { NumericFormat } from "react-number-format"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.ComponentProps<typeof NumericFormat>, "className"> {
    className?: string
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ className, ...props }, ref) => {
        return (
            <NumericFormat
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                thousandSeparator="."
                decimalSeparator=","
                prefix="$ "
                decimalScale={0}
                allowNegative={false}
                getInputRef={ref}
                {...props}
            />
        )
    }
) 