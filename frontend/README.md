# 🖥️ AI Code Reviewer - Frontend Web UI

A modern, accessible, and responsive frontend interface for the AI Code Reviewer system built with React 18, TypeScript, Tailwind CSS, and Monaco Editor.

## 🚀 Features

### Core Interface
- **Interactive Code Editor**: Monaco Editor-based editor with syntax highlighting for 12+ programming languages
- **Review Dashboard**: Visual presentation of code review results with severity filtering
- **Real-time Feedback**: Live character/line counters and review status indicators
- **Keyboard Navigation**: Full keyboard accessibility with Ctrl+Enter submission and skip links

### Accessibility (WCAG 2.1 AA Compliant)
- **Keyboard Skip Link**: "Skip to main content" for screen reader users
- **Focus Management**: Visible `:focus-visible` outlines on all interactive elements
- **Screen Reader Support**: `aria-live="polite"` regions for dynamic status updates
- **Reduced Motion**: Respects `prefers-reduced-motion` system preferences
- **Color Contrast**: All text and UI elements meet 4.5:1 contrast ratios
- **Touch Targets**: Minimum 44x44px interactive elements for mobile accessibility

### Responsive Design
- **Mobile-First**: Optimized for screens from 320px to ultra-wide 4K displays
- **Flexible Layout**: Adaptive sidebar layout that stacks vertically on mobile
- **Touch Friendly**: Generous tap targets and swipe-friendly interactions

### Supported Languages & Modes
- **12 Languages**: Python, JavaScript, TypeScript, Java, Go, Rust, C++, C, C#, PHP, Ruby, Kotlin
- **4 Review Modes**: Comprehensive, Security, Performance, Style

## 🏗️ Architecture

### Technology Stack
- **React 18** with Hooks API
- **TypeScript** for type safety
- **Vite** for fast development and production builds
- **Tailwind CSS** for utility-first styling
- **@monaco-editor/react** for code editing capabilities
- **React Context** with `useReducer` for state management

### Component Structure
```
src/
├── components/
│   ├── Header.tsx           # System header with health status and controls
│   ├── CodeEditor.tsx       # Monaco Editor wrapper with line/char counters
│   ├── ReviewDashboard.tsx  # Results display with filtering and issue cards
│   └── IssueCard.tsx        # Individual issue rendering with copy/highlight actions
├── context/
│   ├── AppContext.tsx       # React Context provider
│   └── AppReducer.ts        # State reducer with typed actions
├── lib/
│   ├── api.ts               # API service layer
│   └── types.ts             # TypeScript interfaces and enums
└── index.css                # Global styles including WCAG 2.1 AA enhancements
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development Commands
```bash
# Start development server
npm run dev

# Run test suite
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables
The frontend connects to the backend API at `http://localhost:8000` by default.
Adjust `VITE_API_URL` in `.env` if needed:
```env
VITE_API_URL=http://localhost:8000
```

## ♿ Accessibility Features

### WCAG 2.1 AA Implementation
1. **Keyboard Navigation**
   - Skip link: Tab to reveal "Skip to main content" link
   - Logical tab order through all interactive elements
   - Enter/Space activation for buttons
   - Arrow key navigation for mode/language selectors

2. **Screen Reader Support**
   - Semantic HTML elements (`header`, `main`, `section[role="region"]`)
   - `aria-label` attributes on icon buttons and controls
   - `aria-live="polite"` regions for status updates:
     - System health checks in header
     - Review completion announcements in dashboard
   - Proper heading hierarchy (h1 → h2 → h3)

3. **Visual Accessibility**
   - `:focus-visible` outlines with 2px blue ring (#3B82F6)
   - 4.5:1 minimum color contrast for text/UI elements
   - Respect for `prefers-reduced-motion` (disables animations)
   - Minimum 44x44px touch targets per WCAG guidelines

4. **Form & Input Accessibility**
   - Associated labels for all form controls
   - Clear error messaging with `role="alert"` styling
   - Placeholder text that disappears on focus (not as sole label)
   - Disabled states with proper aria-disabled attributes

## 🧪 Testing

### Test Suite
- **Vitest** with `@testing-library/react`
- **8 Test Files** covering:
  - App integration (submission, keyboard shortcuts, error handling)
  - Component rendering (Header, CodeEditor, ReviewDashboard, IssueCard)
  - State management and context interactions
  - Accessibility verifications (ARIA labels, keyboard navigation)
  - Responsive behavior breakpoints

### Running Tests
```bash
# Run all tests once
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

## 📦 Production Build

### Build Process
```bash
# Create optimized production build
npm run build

# Outputs to ./dist/ directory
# - index.html (entry point)
# - assets/ (hashed CSS and JS chunks)
```

### Build Optimization
- **Code Splitting**: Automatic route-based splitting
- **Asset Hashing**: Long-term caching with content hashes
- **Minification**: HTML, CSS, and JS minification
- **Tree Shaking**: Removal of unused code
- **CSS Optimization**: PurgeCSS removes unused Tailwind utilities

### Preview Build Locally
```bash
npm run preview
```

## 🌐 Browser Support

### Officially Supported
- Chrome 108+ (recommended)
- Firefox 108+
- Safari 15.4+
- Edge 108+

### Mobile Browsers
- iOS Safari
- Chrome Android
- Firefox Android

## 📱 Responsive Breakpoints

The interface adapts to these common screen widths:
- **Mobile**: < 640px (stacked layout, full-width controls)
- **Tablet**: 640px - 1024px (sidebar begins to appear)
- **Desktop**: > 1024px (full side-by-side editor/dashboard layout)
- **Ultra-wide**: > 1920px (expands to utilize available space)

## 🔐 Security Considerations

### Content Security
- Monaco Editor runs in sandboxed iframe when possible
- User code is never evaluated or executed client-side
- All data flows through authenticated API endpoints
- No storage of sensitive data in localStorage or cookies

### Data Privacy
- No analytics or telemetry collection
- Code submitted for review is only sent to backend API
- Review results are displayed temporarily in session state
- No persistent storage of user code on client

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes following existing code style
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'feat: add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open Pull Request

### Code Style
- Follow existing TypeScript and React patterns
- Use Tailwind utility classes consistently
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This frontend is part of the AI Review System project. See the root [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- Monaco Editor team for the exceptional code editor component
- Tailwind CSS team for the utility-first CSS framework
- React team for the powerful UI library
- Vite team for the blazing fast build tool
- All contributors to the AI Review System project

---
*Built with ❤️ for developers who care about code quality*