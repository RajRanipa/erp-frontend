import { cn } from '@/utils/cn'
import { addIcon } from '@/utils/SVG'
import { title } from 'process'
import React from 'react'

export default function AddButton({
    icon = true,
    title = "add",
    onClick = () => { },
    size = "md",
}) {
    const sizeClass = {
        sm: "btn-sm",
        md: "btn-md",
        lg: "btn-lg",
    }[size]

    return (
        <button type="button" className={cn(`btn btn-secondary flex items-center gap-1 ${sizeClass}`)} onClick={onClick}>
            {icon && <>{addIcon()}</>}
            {title}
        </button>
    )
}
