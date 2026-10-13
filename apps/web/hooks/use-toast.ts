"use client"

import * as React from "react"

export type ToastVariant = "default" | "destructive"

export type ToastProps = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: ToastVariant
  duration?: number
}

type Toast = Required<Pick<ToastProps, "id">> &
  Omit<ToastProps, "id"> & {
    open?: boolean
  }

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 1000 * 5

type State = {
  toasts: Toast[]
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type Action =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "UPDATE_TOAST"; toast: Partial<Toast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryState = {
        ...memoryState,
        toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
      }
      break
    case "UPDATE_TOAST":
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }
      break
    case "DISMISS_TOAST": {
      const { toastId } = action
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.map((t) =>
          t.id === toastId || toastId === undefined ? { ...t, open: false } : t
        ),
      }
      // schedule remove
      if (toastId) {
        setTimeout(() => dispatch({ type: "REMOVE_TOAST", toastId }), 300)
      } else {
        setTimeout(
          () => dispatch({ type: "REMOVE_TOAST" }),
          300
        )
      }
      break
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        memoryState = { ...memoryState, toasts: [] }
      } else {
        memoryState = {
          ...memoryState,
          toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
        }
      }
      break
  }
  listeners.forEach((listener) => listener(memoryState))
}

export function toast({ title, description, variant = "default", duration = 4000, ...props }: ToastProps) {
  const id = props.id || genId()

  const update = (p: ToastProps) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...p, id } })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      title,
      description,
      variant,
      open: true,
    },
  })

  if (duration !== Infinity) {
    setTimeout(() => {
      dismiss()
    }, duration)
  }

  return { id, dismiss, update }
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}
