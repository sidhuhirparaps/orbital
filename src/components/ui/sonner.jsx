import { Toaster as Sonner } from 'sonner'

function Toaster({ ...props }) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-surface group-[.toaster]:text-foreground group-[.toaster]:shadow-neu-out group-[.toaster]:border-0',
          description: 'group-[.toast]:text-muted',
          actionButton: 'group-[.toast]:bg-foreground group-[.toast]:text-surface',
          cancelButton: 'group-[.toast]:bg-surface-alt group-[.toast]:text-muted',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
export default Toaster
