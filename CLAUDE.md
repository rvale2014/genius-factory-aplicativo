# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Start dev server (requires development build installed on device/emulator)
npx expo start

# Build development APK (installs on emulator by dragging .apk)
npx eas-cli build --profile development --platform android

# Preview build (optimized JS, no dev server needed)
npx eas-cli build --profile preview --platform android

# Production build (.aab for Play Store)
npx eas-cli build --profile production --platform android

# OTA update (skips Play Store review)
npx eas update --channel production -m "description"

# Type check
npx tsc --noEmit
```

**When is a new build needed?** Installing native libraries, changing `app.config.ts`, or modifying `android/`. JS-only changes hot-reload via the dev server.

## Architecture

**Expo Router** with file-based routing. Two route groups:
- `app/(auth)/` — PIN verification, login, password reset (Stack navigator)
- `app/(app)/` — Main app with bottom tabs (Dashboard, Cursos, Trilhas, Questões, Menu)

**State**: Jotai atoms in `src/state/session.ts`. Session persisted via `expo-secure-store`.

**API layer**: Axios client (`src/lib/api.ts`) with automatic 401 → token refresh interceptor. Base URL auto-detects emulator vs device. All domain logic in `src/services/` — each service validates responses with Zod schemas from `src/schemas/`.

**Auth flow**: App checks secure storage → redirects to `verificar-pin` or `login` → on success saves session → redirects to dashboard. Parental PIN (6-digit) gates access for young learners.

**Images**: `CachedImage` component wraps `expo-image` with disk caching and Firebase Storage 403 token renewal. Local assets use standard RN `Image`.

## Key Conventions

- **Language**: All UI text, error messages, comments, and variable names in Portuguese
- **Fonts**: Inter (Regular/Medium/SemiBold/Bold) and PlusJakartaSans. Use `getInterFont(weight)` helper to map numeric weight → font family name
- **Colors**: Primary pink `#FF5FDB`, purple `#7A34FF`, teal `#14b8a6`, error `#b00020`
- **Styling**: `StyleSheet.create()` at bottom of each file. `expo-linear-gradient` for gradient backgrounds
- **Icons**: `lucide-react-native` for feature icons, `@expo/vector-icons` (Ionicons) for system icons
- **Path alias**: `@/*` maps to project root (configured in tsconfig)

## Service Layer Pattern

```
src/services/<domain>Service.ts  →  calls api.get/post  →  validates with Zod schema
src/schemas/<domain>.ts          →  Zod schema definitions
```

Services are consumed by screens directly. Caching varies: `alunoHeaderService` has in-memory TTL cache, `CachedImage` uses expo-image disk cache, screens use `useFocusEffect` for silent revalidation.

## Screen Patterns

- `useFocusEffect` for silent background revalidation when screen regains focus
- `useEffect` for initial load with loading spinner
- Pull-to-refresh via `RefreshControl` on scroll views
- Debounced loading (2s) to prevent duplicate requests
- Error states show retry button with user-facing Portuguese message
