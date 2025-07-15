# CSS Architecture for Urban Night Light Mapping

This document outlines the CSS architecture and styling system for the Urban Night Light Mapping application.

## File Structure

```
src/
├── App.css           # Main application styles
├── index.css         # Global styles and CSS reset
├── utilities.css     # Utility classes
└── themes.css        # Theme configurations
```

## CSS Architecture

### 1. Global Styles (`index.css`)
- CSS reset and normalization
- Global typography and base styles
- Accessibility features (focus styles, reduced motion)
- Custom scrollbar styling

### 2. Component Styles (`App.css`)
- Component-specific styles
- Layout definitions
- Interactive states
- Responsive design
- Animations and transitions

### 3. Utility Classes (`utilities.css`)
- Layout utilities (flexbox, grid)
- Spacing utilities (margin, padding)
- Typography utilities
- Color utilities
- Responsive utilities

### 4. Theme System (`themes.css`)
- CSS custom properties (variables)
- Multiple theme variations
- Color schemes
- Consistent spacing and sizing

## Design System

### Colors
- **Primary**: `#4a9eff` (Blue)
- **Secondary**: `#ffd700` (Gold)
- **Success**: `#4caf50` (Green)
- **Error**: `#f44336` (Red)
- **Warning**: `#ff9800` (Orange)

### Typography
- **Font Family**: System fonts (-apple-system, BlinkMacSystemFont, etc.)
- **Font Sizes**: 12px - 28px with responsive scaling
- **Font Weights**: 300, 400, 500, 600, 700

### Spacing
- **Base Unit**: 0.25rem (4px)
- **Scale**: 1x, 2x, 3x, 4x, 5x (4px, 8px, 12px, 16px, 20px)

### Border Radius
- **Small**: 4px
- **Medium**: 8px
- **Large**: 12px

### Shadows
- **Small**: `0 2px 8px rgba(0, 0, 0, 0.2)`
- **Medium**: `0 4px 16px rgba(0, 0, 0, 0.3)`
- **Large**: `0 8px 32px rgba(0, 0, 0, 0.4)`

## Component Breakdown

### Control Panel
- Semi-transparent dark background
- Glassmorphism effect with backdrop blur
- Hover animations and transitions
- Responsive design for mobile devices

### Analysis Panel
- Slide-in animation from the right
- Expandable content sections
- Close button with hover effects
- Statistics visualization

### Loading States
- Animated loading screens
- Spinner animations
- Shimmer effects for loading content
- Progressive enhancement

### Buttons
- Primary and secondary variants
- Hover and focus states
- Disabled states with loading indicators
- Accessibility-compliant focus rings

## Responsive Design

### Breakpoints
- **Mobile**: 480px and below
- **Tablet**: 768px and below
- **Desktop**: 1024px and above

### Mobile Adaptations
- Collapsible control panel
- Full-width analysis panel
- Touch-friendly button sizes
- Optimized spacing and typography

## Accessibility Features

### High Contrast Support
- Dedicated high-contrast theme
- Enhanced border visibility
- Improved text contrast ratios

### Reduced Motion
- Respects `prefers-reduced-motion` setting
- Minimal animations for sensitive users
- Smooth scrolling can be disabled

### Focus Management
- Visible focus indicators
- Skip links for keyboard navigation
- Proper tab order
- Screen reader support

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus trapping in modals
- Escape key handlers

## Animations

### Transitions
- **Fast**: 0.15s for micro-interactions
- **Normal**: 0.2s for standard transitions
- **Slow**: 0.3s for layout changes

### Keyframe Animations
- `slideIn`: Panel entrance animation
- `fadeIn`: Content appearance
- `spin`: Loading spinner
- `pulse`: Status indicators
- `bounce`: Attention-grabbing elements

## Performance Considerations

### CSS Optimization
- Minimal selector nesting
- Efficient use of CSS custom properties
- Hardware-accelerated animations
- Reduced paint and reflow operations

### Loading Strategy
- Critical CSS inlined
- Non-critical CSS loaded asynchronously
- CSS minification in production
- Tree-shaking of unused styles

## Theme Customization

### Available Themes
1. **Dark Night Sky** (default)
2. **City Lights** (orange accent)
3. **Satellite** (cyan accent)
4. **High Contrast** (accessibility)

### Switching Themes
Themes can be switched by applying the appropriate class to the root element:

```javascript
document.documentElement.className = 'theme-city';
```

### Custom Themes
New themes can be created by defining CSS custom properties:

```css
.theme-custom {
  --primary-color: #your-color;
  --background-panel: rgba(your-values);
  /* ... other variables */
}
```

## Browser Support

### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Fallbacks
- CSS Grid with Flexbox fallback
- CSS custom properties with fallback values
- Modern CSS features with progressive enhancement

## Maintenance Guidelines

### Code Organization
- Keep component styles together
- Use meaningful class names
- Follow BEM methodology where appropriate
- Document complex CSS with comments

### Performance Monitoring
- Monitor CSS bundle size
- Check for unused CSS
- Validate accessibility compliance
- Test across different devices and browsers

### Updates and Changes
- Use CSS custom properties for easy theming
- Maintain consistent naming conventions
- Test responsive design on multiple devices
- Validate accessibility after changes
