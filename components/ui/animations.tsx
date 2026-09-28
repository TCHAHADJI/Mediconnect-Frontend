import React from 'react';
import { cn } from './utils';

// Animation wrapper component for consistent micro-interactions
interface AnimatedWrapperProps {
  children: React.ReactNode;
  animation?: 'fadeIn' | 'slideUp' | 'slideRight' | 'slideLeft' | 'scaleIn' | 'bounceIn';
  delay?: number;
  duration?: number;
  className?: string;
  hover?: 'lift' | 'glow' | 'scale' | 'bounce';
  onClick?: () => void;
}

export function AnimatedWrapper({
  children,
  animation = 'fadeIn',
  delay = 0,
  duration = 500,
  className,
  hover,
  onClick
}: AnimatedWrapperProps) {
  const animationClass = {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-in-up',
    slideRight: 'animate-slide-in-right',
    slideLeft: 'animate-slide-in-left',
    scaleIn: 'animate-scale-in',
    bounceIn: 'animate-bounce-in'
  }[animation];

  const hoverClass = hover ? {
    lift: 'hover-lift',
    glow: 'hover-glow',
    scale: 'hover-scale',
    bounce: 'hover-bounce'
  }[hover] : '';

  return (
    <div
      className={cn(
        animationClass,
        hoverClass,
        onClick && 'click-shrink focus-ring cursor-pointer',
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

// Loading animation component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

export function LoadingSpinner({ size = 'md', variant = 'primary', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const variantClasses = {
    primary: 'border-primary border-t-transparent',
    secondary: 'border-secondary border-t-transparent',
    accent: 'border-accent border-t-transparent'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    />
  );
}

// Shimmer loading effect
interface ShimmerProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Shimmer({ width = '100%', height = '1rem', className }: ShimmerProps) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-muted rounded',
        className
      )}
      style={{ width, height }}
    />
  );
}

// Floating action button with enhanced animations
interface FloatingButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
  float?: boolean;
}

export function FloatingButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  pulse = false,
  float = false
}: FloatingButtonProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800',
    secondary: 'bg-gradient-to-br from-secondary-500 to-secondary-700 hover:from-secondary-600 hover:to-secondary-800',
    accent: 'bg-gradient-to-br from-accent-500 to-accent-700 hover:from-accent-600 hover:to-accent-800'
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 rounded-full shadow-strong text-white',
        'flex items-center justify-center transition-all duration-300',
        'hover:scale-110 hover:shadow-glow click-shrink focus-ring',
        sizeClasses[size],
        variantClasses[variant],
        pulse && 'animate-pulse-glow',
        float && 'animate-float',
        className
      )}
    >
      {children}
    </button>
  );
}

// Progress bar with animation
interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  animated = true,
  className
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-400 to-primary-600',
    secondary: 'bg-gradient-to-r from-secondary-400 to-secondary-600',
    accent: 'bg-gradient-to-r from-accent-400 to-accent-600'
  };

  return (
    <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeClasses[size], className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-700 ease-out',
          variantClasses[variant],
          animated && 'animate-shimmer'
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Notification toast with animations
interface NotificationToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
  duration?: number;
}

export function NotificationToast({
  message,
  type = 'info',
  onClose,
  duration = 5000
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeClasses = {
    success: 'bg-secondary-50 border-secondary-200 text-secondary-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800'
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg border shadow-strong',
        'transition-all duration-300 transform',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        typeClasses[type]
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{message}</p>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// Stagger container for list animations
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className, staggerDelay = 100 }: StaggerContainerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="animate-slide-in-up"
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// Interactive card with hover effects
interface InteractiveCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function InteractiveCard({
  children,
  onClick,
  className,
  hover = true,
  glow = false
}: InteractiveCardProps) {
  return (
    <div
      className={cn(
        'bg-card border rounded-lg p-6 transition-all duration-300',
        hover && 'hover-lift',
        glow && 'hover-glow',
        onClick && 'cursor-pointer click-shrink focus-ring',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}