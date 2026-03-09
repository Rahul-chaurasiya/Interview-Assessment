import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepperProps {
  steps: {
    id: string
    label: string
    description?: string
  }[]
  currentStep: number
  completed?: number[]
}

const Stepper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & StepperProps
>(({ className, steps, currentStep, completed = [], ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between w-full", className)}
      {...props}
    >
      {steps.map((step, index) => {
        const isCompleted = completed.includes(index) || index < currentStep
        const isCurrent = index === currentStep
        const isUpcoming = index > currentStep

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center">
              {/* Step Circle */}
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                  isCompleted
                    ? "bg-primary text-primary-foreground border-primary"
                    : isCurrent
                    ? "bg-primary text-primary-foreground border-primary ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground border-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              {/* Step Text */}
              <div className="ml-4 hidden sm:block">
                <div className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  isCompleted || isCurrent
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}>
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-16 h-0.5 mx-4 transition-colors duration-300",
                  isCompleted
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
})

Stepper.displayName = "Stepper"

export { Stepper }
