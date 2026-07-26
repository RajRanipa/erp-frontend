import { cn } from '@/utils/cn'
import { addIcon } from '@/utils/SVG'
import { title } from 'process'
import React from 'react'

export default function AddButton({
    icon = true,
    title = "add",
    onClick = () => { },
    size = "md",
    type = "button",
    className = "",
}) {
    const sizeClass = {
        sm: "btn-sm",
        md: "btn-md",
        lg: "btn-lg",
    }[size]

    return (
        <>
            {(type === "button") &&
                <button type="button" className={cn(`btn btn-secondary flex items-center gap-1 ${sizeClass, className}`)} onClick={onClick}>
                    {icon && <>{addIcon()}</>}
                    {title}
                </button>}

            {(type === "iconButton") &&
                <button type={type} className={cn(`btn hover:bg-action bg-action/70 border border-blue-500/50 flex items-center text-white justify-center min-h-[38px] min-w-[38px] 
                    focus:outline-none focus:border-0.5 focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500  ${sizeClass, className}`)} onClick={onClick}>
                    {<>{addIcon()}</>}
                </button>
            }
        </>
    )
}
