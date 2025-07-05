# Augmi - Design System

## 🎨 Color Palette

### Primary Colors
| Name | HEX | Usage |
|------|-----|-------|
| Augmi Black | `#0E0E0F` | Main backgrounds, page backgrounds |
| Steel Gray | `#2D2D30` | Surface elements, cards, modals, headers |
| Platinum Silver | `#C0C0C8` | Secondary text, descriptions |
| Chrome Accent | `#A1A1AA` | Icons, borders, dividers, placeholders |

### Interactive Colors
| Name | HEX | Usage |
|------|-----|-------|
| Electric Blue | `#3B82F6` | CTAs, interactive highlights, primary buttons |
| White Smoke | `#F5F5F7` | Primary text on dark backgrounds |
| Success Green | `#22C55E` | Success states, confirmation indicators |
| Error Red | `#EF4444` | Error messages, logout buttons |

### Color Usage Guidelines
- **Backgrounds**: Use Augmi Black for main page backgrounds
- **Surfaces**: Use Steel Gray for cards, modals, and elevated surfaces
- **Text**: Use White Smoke for primary text, Platinum Silver for secondary text
- **Borders**: Use Chrome Accent with 20% opacity for subtle borders
- **Interactive Elements**: Use Electric Blue for primary actions, Success Green for confirmations, Error Red for destructive actions

## 📝 Typography

### Font Stack
- **Primary**: Geist Sans (system font fallback)
- **Monospace**: Geist Mono (system font fallback)

### Font Sizes
| Size | Class | Usage |
|------|-------|-------|
| xs | `text-xs` | Captions, metadata |
| sm | `text-sm` | Body text, labels |
| base | `text-base` | Default body text |
| lg | `text-lg` | Subheadings |
| xl | `text-xl` | Section headings |
| 2xl | `text-2xl` | Page titles |
| 3xl | `text-3xl` | Hero titles |
| 4xl | `text-4xl` | Large hero titles |

### Font Weights
- **Normal**: `font-normal` (400)
- **Medium**: `font-medium` (500)
- **Semibold**: `font-semibold` (600)
- **Bold**: `font-bold` (700)

## 🎯 Buttons

### Button Specifications
All buttons follow a consistent design pattern with the following specifications:

#### Base Button Classes
```css
/* Primary Button */
. {
  @apply bg-[#3B82F6] hover:bg-[#3B82F6]/80 text-[#F5F5F7] 
         px-4 py-2.5 rounded-xl transition-all duration-200 
         font-medium text-sm disabled:bg-[#A1A1AA] 
         disabled:cursor-not-allowed focus:outline-none 
         focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 
         focus:ring-offset-[#0E0E0F];
}

/* Secondary Button */
.btn-secondary {
  @apply bg-[#A1A1AA] hover:bg-[#A1A1AA]/80 text-[#F5F5F7] 
         px-4 py-2.5 rounded-xl transition-all duration-200 
         font-medium text-sm disabled:bg-[#A1A1AA]/50 
         disabled:cursor-not-allowed focus:outline-none 
         focus:ring-2 focus:ring-[#A1A1AA] focus:ring-offset-2 
         focus:ring-offset-[#0E0E0F];
}

/* Success Button */
. {
  @apply bg-[#22C55E] hover:bg-[#22C55E]/80 text-[#F5F5F7] 
         px-4 py-2.5 rounded-xl transition-all duration-200 
         font-medium text-sm disabled:bg-[#A1A1AA] 
         disabled:cursor-not-allowed focus:outline-none 
         focus:ring-2 focus:ring-[#22C55E] focus:ring-offset-2 
         focus:ring-offset-[#0E0E0F];
}

/* Danger Button */
.btn-danger {
  @apply bg-[#EF4444] hover:bg-[#EF4444]/80 text-[#F5F5F7] 
         px-4 py-2.5 rounded-xl transition-all duration-200 
         font-medium text-sm disabled:bg-[#A1A1AA] 
         disabled:cursor-not-allowed focus:outline-none 
         focus:ring-2 focus:ring-[#EF4444] focus:ring-offset-2 
         focus:ring-offset-[#0E0E0F];
}

/* Ghost Button */
.btn-ghost {
  @apply bg-transparent hover:bg-[#A1A1AA]/10 text-[#C0C0C8] 
         hover:text-[#F5F5F7] px-4 py-2.5 rounded-xl transition-all duration-200 
         font-medium text-sm disabled:bg-transparent 
         disabled:cursor-not-allowed focus:outline-none 
         focus:ring-2 focus:ring-[#A1A1AA] focus:ring-offset-2 
         focus:ring-offset-[#0E0E0F];
}
```

#### Button Sizes
| Size | Padding | Usage |
|------|---------|-------|
| Small | `px-3 py-2` | Compact spaces, icons only |
| Medium | `px-4 py-2.5` | **Default** - Most buttons |
| Large | `px-6 py-3` | Primary CTAs, hero buttons |

#### Button States
- **Default**: Solid background with hover opacity
- **Hover**: 80% opacity of base color
- **Active**: 90% opacity of base color
- **Disabled**: Chrome Accent color with reduced opacity
- **Focus**: Ring with 2px width and offset

### Button Usage Guidelines
- **Primary Actions**: Use Electric Blue buttons
- **Secondary Actions**: Use Chrome Accent buttons
- **Success Actions**: Use Success Green buttons
- **Destructive Actions**: Use Error Red buttons
- **Navigation**: Use Ghost buttons for subtle navigation

## 📐 Spacing

### Spacing Scale
| Size | Value | Usage |
|------|-------|-------|
| 1 | `0.25rem` (4px) | Minimal spacing |
| 2 | `0.5rem` (8px) | Small spacing |
| 3 | `0.75rem` (12px) | Medium spacing |
| 4 | `1rem` (16px) | **Base spacing** |
| 6 | `1.5rem` (24px) | Large spacing |
| 8 | `2rem` (32px) | Extra large spacing |
| 12 | `3rem` (48px) | Section spacing |
| 16 | `4rem` (64px) | Page spacing |

### Container Spacing
- **Page Padding**: `px-4 sm:px-6 lg:px-8`
- **Card Padding**: `p-4 sm:p-6 lg:p-8`
- **Button Padding**: `px-4 py-2.5` (default)

## 🎨 Components

### Cards
```css
.card {
  @apply bg-[#2D2D30] backdrop-blur-lg rounded-2xl 
         border border-[#A1A1AA]/20 p-4 sm:p-6 lg:p-8;
}
```

### Input Fields
```css
.input {
  @apply w-full px-3 sm:px-4 py-3 bg-[#A1A1AA]/10 
         border border-[#A1A1AA]/20 rounded-xl 
         text-[#F5F5F7] placeholder-[#A1A1AA] 
         focus:outline-none focus:ring-2 focus:ring-[#3B82F6] 
         focus:border-[#3B82F6] transition-all duration-200;
}
```

### Modals
```css
.modal-overlay {
  @apply fixed inset-0 bg-[#0E0E0F]/50 backdrop-blur-sm 
         flex items-center justify-center z-50 p-2 sm:p-4;
}

.modal-content {
  @apply bg-[#2D2D30] backdrop-blur-lg rounded-2xl 
         border border-[#A1A1AA]/20 p-4 sm:p-6 lg:p-8 
         w-full max-w-4xl max-h-[95vh] overflow-y-auto;
}
```

## 📱 Responsive Design

### Breakpoints
| Breakpoint | Class | Min Width |
|------------|-------|-----------|
| Mobile | Default | 0px |
| Small | `sm:` | 640px |
| Medium | `md:` | 768px |
| Large | `lg:` | 1024px |
| Extra Large | `xl:` | 1280px |

### Mobile-First Approach
- Design for mobile first, then enhance for larger screens
- Use responsive prefixes (`sm:`, `md:`, `lg:`) for progressive enhancement
- Ensure touch targets are at least 44px minimum

## ♿ Accessibility

### Focus States
- All interactive elements must have visible focus states
- Use ring with 2px width and appropriate offset
- Focus ring color matches the interactive element's primary color

### Color Contrast
- Text on Augmi Black: White Smoke provides sufficient contrast
- Text on Steel Gray: White Smoke provides sufficient contrast
- Interactive elements: Electric Blue provides sufficient contrast

### Screen Reader Support
- Use semantic HTML elements
- Provide appropriate ARIA labels
- Ensure proper heading hierarchy

## 🎯 Implementation Guidelines

### CSS Classes
- Use Tailwind utility classes for consistent styling
- Create custom components for complex patterns
- Maintain consistent naming conventions

### Component Structure
- Separate concerns: layout, styling, and behavior
- Use composition over inheritance
- Keep components focused and reusable

### Performance
- Minimize CSS bundle size
- Use Tailwind's purge feature
- Optimize for critical rendering path

## 📋 Checklist

### Before Shipping
- [ ] All buttons follow the design system specifications
- [ ] Color palette is consistently applied
- [ ] Typography hierarchy is maintained
- [ ] Spacing follows the defined scale
- [ ] Responsive design works on all breakpoints
- [ ] Accessibility requirements are met
- [ ] Focus states are visible and appropriate
- [ ] Touch targets meet minimum size requirements

### Maintenance
- [ ] Review design system quarterly
- [ ] Update documentation when changes are made
- [ ] Ensure new components follow the system
- [ ] Test across different devices and browsers 