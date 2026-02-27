# PennyWise Design System & Style Guide

## Design Principles
- **Brutalist Minimalism**: Sharp edges (0px border radius), high contrast, and bold typography.
- **Local-First**: Design reflects security and privacy.
- **Consistency**: Unified spacing and typography scales across all components.

## Color Palette

### Light Theme
- **Primary**: `#2563EB` (Action blue)
- **Background**: `#F8FAFC`
- **Surface**: `#FFFFFF`
- **Text Primary**: `#0F172A`
- **Text Secondary**: `#64748B`
- **Border**: `#E2E8F0`

### Dark Theme
- **Primary**: `#2563EB`
- **Background**: `#0F172A`
- **Surface**: `#1E293B`
- **Text Primary**: `#F8FAFC`
- **Text Secondary**: `#94A3B8`
- **Border**: `#334155`

### Functional Colors
- **Income/Success**: `#16A34A`
- **Expense/Error**: `#DC2626`
- **Warning**: `#F59E0B`
- **Info**: `#0284C7`

## Typography (Space Grotesk)
We use a standardized scale defined in `AppTheme`:

- **Display Large**: 32pt, W900 (Page Titles)
- **Headline Large**: 20pt, W900 (Section Headers)
- **Title Large**: 16pt, W700 (Card Titles)
- **Body Large**: 16pt, W400 (Main Content)
- **Body Medium**: 14pt, W400 (Secondary Content)
- **Label Large**: 14pt, W900 (Button Text)

## Spacing System
Standardized in `AppSpacing`:

- **XS**: 4dp
- **S**: 8dp
- **M**: 16dp
- **L**: 24dp
- **XL**: 32dp

## Layout Patterns
- **Page Padding**: Use `AppSpacing.pM` (16dp) or `AppSpacing.pL` (24dp) for screen margins.
- **Card Styling**: Elevation 0, 0px border radius, 1px border.
- **Input Fields**: 0px border radius, filled background, bold labels.

## Text Alignment Rules
- **Titles/Headers**: Left-aligned by default. Center-aligned for app bars or splash screens.
- **Body Text**: Left-aligned for readability.
- **Numerical Data**: Right-aligned in lists/tables for easier comparison.

## Code Review Checklist
1. [ ] No hard-coded colors. Use `Theme.of(context).colorScheme` or `AppColors`.
2. [ ] No hard-coded spacing. Use `AppSpacing` tokens.
3. [ ] No hard-coded `TextStyle`. Use `Theme.of(context).textTheme`.
4. [ ] Border radius must be 0 for all interactive elements.
5. [ ] Input fields must use `InputDecorationTheme`.
