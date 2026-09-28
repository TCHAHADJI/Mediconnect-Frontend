# MediConnect Brand Guidelines

## Overview
MediConnect is a healthcare platform that bridges the gap between patients and pharmacies in Cameroon. Our design system reflects trust, professionalism, accessibility, and innovation in healthcare technology.

## Color Palette

### Primary Colors (Medical Blue)
Our primary color palette is based on medical blue, conveying trust, reliability, and professionalism.

- **Primary 500**: `#3B82F6` - Main brand color
- **Primary 600**: `#2563EB` - Primary actions, CTA buttons
- **Primary 700**: `#1D4ED8` - Hover states, emphasis
- **Primary 50**: `#EFF6FF` - Background tints, subtle highlights
- **Primary 100**: `#DBEAFE` - Light backgrounds, disabled states

### Secondary Colors (Health Green)
Green represents health, growth, and positive outcomes.

- **Secondary 500**: `#10B981` - Success states, health indicators
- **Secondary 600**: `#059669` - Secondary actions, confirmations
- **Secondary 700**: `#047857` - Hover states for secondary elements
- **Secondary 50**: `#ECFDF5` - Success backgrounds
- **Secondary 100**: `#D1FAE5` - Light success indicators

### Accent Colors (Care Purple)
Purple adds sophistication and represents care, innovation, and premium service.

- **Accent 500**: `#8B5CF6` - Special features, premium indicators
- **Accent 600**: `#7C3AED` - Accent actions, special callouts
- **Accent 700**: `#6D28D9` - Hover states for accent elements
- **Accent 50**: `#F5F3FF` - Accent backgrounds
- **Accent 100**: `#EDE9FE` - Light accent indicators

### Semantic Colors
- **Success**: `#059669` (Secondary Green)
- **Warning**: `#D97706` (Amber)
- **Error**: `#DC2626` (Red)
- **Info**: `#2563EB` (Primary Blue)

## Typography

### Hierarchy
- **H1**: 2rem, font-weight: 600, line-height: 1.2 - Page titles
- **H2**: 1.75rem, font-weight: 600, line-height: 1.3 - Section headers
- **H3**: 1.5rem, font-weight: 600, line-height: 1.3 - Subsection headers
- **H4**: 1.25rem, font-weight: 600, line-height: 1.4 - Card titles
- **Body**: 1rem, font-weight: 400, line-height: 1.6 - Main content
- **Small**: 0.875rem, font-weight: 400, line-height: 1.5 - Captions, metadata

### Best Practices
- Use gradient text sparingly for brand elements and special callouts
- Maintain consistent letter spacing for better readability
- Ensure proper contrast ratios for accessibility

## Layout & Spacing

### Grid System
- Maximum content width: 1280px (7xl)
- Container padding: 1rem (mobile), 1.5rem (tablet), 2rem (desktop)
- Grid gaps: 1rem (mobile), 1.5rem (tablet), 2rem (desktop)

### Spacing Scale
- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)
- **3xl**: 4rem (64px)

## Components

### Buttons

#### Primary Button
- **Purpose**: Main actions (Sign Up, Get Started, Submit)
- **Style**: Gradient from primary-500 to primary-700
- **Hover**: Scale + shadow glow effect
- **Usage**: One per section for the most important action

#### Secondary Button
- **Purpose**: Alternative actions (Learn More, Cancel)
- **Style**: Gradient from secondary-500 to secondary-700
- **Hover**: Lift + shadow effect
- **Usage**: Supporting actions alongside primary buttons

#### Ghost Button
- **Purpose**: Tertiary actions (Skip, Later)
- **Style**: Transparent background, colored text
- **Hover**: Background tint + scale effect
- **Usage**: Low-emphasis actions

### Cards

#### Interactive Cards
- **Default**: White background, soft shadow, rounded corners
- **Hover**: Lift animation + medium shadow
- **Click**: Scale down briefly for feedback
- **Border**: Subtle border using primary-100

#### Feature Cards
- **Background**: Gradient from primary-50 to secondary-50
- **Icons**: Gradient backgrounds matching accent colors
- **Animation**: Staggered entrance animations
- **Hover**: Glow effect + lift animation

### Navigation

#### Sidebar Navigation
- **Background**: White with backdrop blur
- **Active State**: Gradient background + glow effect
- **Hover**: Background tint + lift effect
- **Icons**: Consistent 16px size with proper spacing

#### Mobile Navigation
- **Sheet**: Backdrop blur with slide animation
- **Staggered Items**: 50ms delay between items
- **Touch Targets**: Minimum 44px for accessibility

## Animations & Micro-interactions

### Animation Principles
- **Purposeful**: Every animation serves a functional purpose
- **Subtle**: Enhance, don't distract from content
- **Consistent**: Use established timing and easing
- **Accessible**: Respect prefers-reduced-motion

### Timing
- **Fast**: 150ms - Immediate feedback (hovers, clicks)
- **Normal**: 250ms - State changes, small movements
- **Slow**: 350ms - Page transitions, complex animations

### Common Animations
- **Hover Lift**: `transform: translateY(-2px)` + shadow
- **Click Shrink**: `transform: scale(0.95)` for 150ms
- **Fade In**: Opacity 0 to 1 over 300ms
- **Slide Up**: `translateY(30px)` to 0 over 500ms
- **Stagger**: 50-100ms delay between list items

### Loading States
- **Spinner**: Primary color, appropriate size
- **Shimmer**: Gradient animation for content placeholders
- **Progress**: Animated gradient bars for longer operations

## Icons

### Style
- **Library**: Lucide React icons
- **Size**: 16px (small), 20px (medium), 24px (large)
- **Stroke**: 2px stroke width for consistency
- **Color**: Inherit from parent for flexibility

### Usage
- Always pair with text labels in navigation
- Use semantic icons (pill for medicine, map pin for location)
- Maintain consistent sizing within component groups

## Accessibility

### Color Contrast
- **Text**: Minimum 4.5:1 ratio with background
- **Interactive Elements**: Minimum 3:1 ratio
- **Focus Indicators**: 2px primary color outline

### Focus Management
- **Visible Focus**: Clear outline on all interactive elements
- **Tab Order**: Logical sequence through page content
- **Skip Links**: Available for keyboard navigation

### Motion
- **Reduced Motion**: Respect user preferences
- **Essential Animation**: Maintain functional animations
- **Fallbacks**: Provide alternatives for complex animations

## Implementation Guidelines

### CSS Variables
Use the predefined CSS variables for consistency:
```css
color: var(--primary);
background: var(--primary-50);
border: 1px solid var(--primary-200);
```

### Component Classes
Use the utility classes for common patterns:
```css
.hover-lift - Hover lift effect
.click-shrink - Click feedback
.gradient-bg-primary - Primary gradient background
.shadow-glow - Glowing shadow effect
```

### Animation Classes
Apply consistent animations:
```css
.animate-slide-in-up - Entrance animation
.animate-fade-in - Fade entrance
.hover-scale - Scale on hover
.animate-pulse-soft - Subtle pulse effect
```

## Do's and Don'ts

### Do's
✅ Use the three-color system consistently
✅ Apply hover effects to interactive elements
✅ Maintain proper spacing and alignment
✅ Use animations to guide user attention
✅ Ensure sufficient color contrast
✅ Test on mobile devices regularly

### Don'ts
❌ Mix color systems or add arbitrary colors
❌ Overuse animations or make them too aggressive
❌ Ignore accessibility guidelines
❌ Use too many different button styles
❌ Forget to test in dark mode
❌ Apply hover effects to non-interactive elements

## Dark Mode Considerations

### Color Adjustments
- Primary colors become lighter for better contrast
- Background becomes dark with light text
- Maintain brand recognition while improving readability
- Ensure interactive elements remain clearly distinguishable

### Testing
- Test all components in both light and dark modes
- Verify color contrast ratios in dark mode
- Ensure animations work well with dark backgrounds
- Check that gradients remain effective

---

This brand guide ensures consistency across the MediConnect platform while maintaining flexibility for future growth and enhancements.