# ESLint & TypeScript Best Practices for World Engine

## 🎯 Current Status

### ✅ TypeScript Compilation
**Status**: 100% CLEAN (0 errors)
- All import errors resolved
- Type safety maintained across entire codebase
- CI pipeline unblocked

### ⚠️ ESLint Warnings
**Status**: 189 warnings (well below CI limit of 440)
- Non-blocking warnings
- Mostly unused parameters in placeholder/stub functions
- Some React Hook dependency optimizations possible

---

## 📋 Common Patterns & Solutions

### Pattern 1: Unused Function Parameters

**❌ Problem:**
```typescript
// ESLint error: 'param' is defined but never used
function placeholder(param: string) {
    return {};
}
```

**✅ Solution:**
```typescript
// Prefix with underscore to indicate intentionally unused
function placeholder(_param: string) {
    return {};
}
```

**When to use:**
- Interface implementations with unused params
- Placeholder/stub functions for future features
- Event handlers that don't need all parameters

---

### Pattern 2: React Hook Dependencies

**❌ Problem:**
```typescript
const MyComponent = () => {
    const doSomething = () => {
        // Uses component state
    };
    
    useEffect(() => {
        doSomething(); // ❌ Missing from dependencies
    }, [dependency]);
};
```

**✅ Solution A: Move Function Inside useEffect** (Recommended)
```typescript
const MyComponent = () => {
    useEffect(() => {
        const doSomething = () => {
            // All dependencies captured in closure
        };
        doSomething();
    }, [dependency]);
};
```

**✅ Solution B: Use useCallback** (When function needed elsewhere)
```typescript
const MyComponent = () => {
    const doSomething = useCallback(() => {
        // Function logic
    }, [dependency1, dependency2]);
    
    useEffect(() => {
        doSomething();
    }, [doSomething]); // Include the memoized function
};
```

**✅ Solution C: Extract Pure Function** (No state dependencies)
```typescript
// Outside component - no React dependencies
const pureFn = (param1, param2) => {
    return param1 + param2;
};

const MyComponent = () => {
    useEffect(() => {
        const result = pureFn(value1, value2);
    }, [value1, value2]); // No function dependency
};
```

---

### Pattern 3: Unused Imports

**❌ Problem:**
```typescript
import { Used, Unused, AlsoUnused } from './module';
// ESLint warns about Unused and AlsoUnused
```

**✅ Solution A: Remove Unused**
```typescript
import { Used } from './module';
```

**✅ Solution B: Prefix for Future Use**
```typescript
import { Used, Unused as _Unused } from './module';
// Indicates import is for future use
```

---

### Pattern 4: Unused Variables

**❌ Problem:**
```typescript
const MyComponent = () => {
    const [value, setValue] = useState();
    // setValue never used
};
```

**✅ Solution:**
```typescript
const MyComponent = () => {
    const [value, _setValue] = useState();
    // Or just remove if truly not needed
};
```

---

### Pattern 5: Interface/Type Parameters

**❌ Problem:**
```typescript
interface Handler {
    onClick: (event: MouseEvent) => void; // event unused
}
```

**✅ Solution:**
```typescript
interface Handler {
    onClick: (_event: MouseEvent) => void;
    // Underscore prefix for type definition
}
```

---

## 🔧 Quick Fixes by Category

### Core Files (Placeholder Functions)
Many warnings in `src/core/` are intentional placeholders for future features:
- `src/core/action/effects.ts` - Combat action effects (WIP)
- `src/core/spell/` - Magic system (WIP)
- `src/core/turn/` - Turn-based mechanics (WIP)

**Action:** Prefix all unused params with underscore, leave logic for later implementation.

### Battle System
- **HoneycombRenderer.tsx**: Event handler params often unused
- **BattleSystem.tsx**: Some React Hook deps can be optimized
- **Solution**: Move functions inside useEffect or use useCallback

### Character Creation
- **CharacterCreate.tsx**: Complex state dependencies
- **Solution**: Extract validation logic to separate hooks with proper dependencies

### UI Components
- **GameMenu.tsx**, **MainMenu.tsx**: Callback params sometimes unused
- **Solution**: Prefix callback params with underscore in interface definitions

---

## 🚀 Systematic Cleanup Approach

### Priority 1: Critical (Blocks CI)
- ✅ TypeScript errors (DONE - 0 errors)
- ✅ ESLint errors (DONE - 0 errors)

### Priority 2: High (Code Quality)
- React Hook exhaustive-deps warnings
- Unused variables that indicate incomplete logic
- Missing function implementations

### Priority 3: Medium (Code Cleanliness)
- Unused imports
- Unused function parameters in active code
- Complex dependency arrays that could be simplified

### Priority 4: Low (Future Work)
- Placeholder function parameters (intentional)
- Stub implementations waiting for features
- Documentation TODOs

---

## 📊 ESLint Warning Breakdown

### By Category (Current: 189 warnings)

**Unused Parameters (Interface/Stub Functions)**: ~120 warnings
- Core action effects: 8 warnings
- Core creator: 12 warnings  
- Core spell system: 10 warnings
- Core turn system: 15 warnings
- AI tactical: 20 warnings
- Combat UI: 15 warnings
- **Strategy**: Prefix with underscore, indicates future implementation

**React Hook Dependencies**: ~25 warnings
- Battle components: 5 warnings
- Character creation: 3 warnings
- World generation: 2 warnings
- UI components: 15 warnings
- **Strategy**: Refactor to use proper dependency patterns

**Unused Imports**: ~30 warnings
- Type imports not yet used: 15 warnings
- Future feature imports: 15 warnings
- **Strategy**: Remove or alias with underscore prefix

**Unused Variables**: ~14 warnings
- Destructured but unused: 8 warnings
- Assigned but never read: 6 warnings
- **Strategy**: Remove if truly unused, prefix if placeholder

---

## 🛠️ Tools & Commands

### Check Status
```bash
# TypeScript compilation
npm run typecheck

# ESLint warnings
npm run lint

# Count warnings by type
npx eslint . --format=compact | grep "Warning"
```

### Auto-Fix Safe Issues
```bash
# Auto-fix formatting and simple issues
npm run lint:fix

# Check what would be fixed
npx eslint . --fix-dry-run
```

### CI Limits
- **TypeScript**: 0 errors (strict)
- **ESLint Warnings**: ≤ 440 warnings (current: 189)
- **ESLint Errors**: 0 errors (strict)

---

## 📝 Contribution Guidelines

### Before Committing
1. ✅ Run `npm run typecheck` - must pass with 0 errors
2. ✅ Run `npm run lint` - check warning count stays below 440
3. ✅ Test functionality - ensure no features broken
4. ✅ Review changes - verify intentional modifications only

### Writing New Code
1. **Avoid** functions with unused parameters - refactor interface if needed
2. **Use** useCallback for functions in useEffect dependencies
3. **Move** functions inside useEffect when only used there
4. **Prefix** intentionally unused params with underscore
5. **Remove** unused imports immediately

### Refactoring Existing Code
1. **Check** if unused param is a placeholder for future work
2. **Verify** removing/renaming doesn't break external consumers
3. **Test** affected components after refactoring hooks
4. **Document** why parameters are unused (if keeping for interface compliance)

---

## 🎓 Learning Resources

### React Hooks Rules
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [useEffect Dependencies](https://react.dev/reference/react/useEffect#dependencies)
- [useCallback](https://react.dev/reference/react/useCallback)

### ESLint Configuration
- [no-unused-vars](https://eslint.org/docs/latest/rules/no-unused-vars)
- [react-hooks/exhaustive-deps](https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks)

### TypeScript Best Practices
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Unused Parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#optional-parameters-and-properties)

---

## 📈 Progress Tracking

### Historical Progress
| Date | TypeScript Errors | ESLint Warnings | Notes |
|------|-------------------|-----------------|-------|
| 2025-10-09 (Start) | 79 | 322 | Initial CI failures |
| 2025-10-09 (Phase 1) | 39 | 192 | Fixed variable references |
| 2025-10-09 (Phase 2) | 5 | 189 | Fixed core functionality |
| 2025-10-09 (Final) | **0** | **189** | ✅ CI UNBLOCKED |

### Goals
- **Short-term**: Keep ESLint warnings < 200 (current: 189 ✅)
- **Medium-term**: Reduce to < 100 warnings
- **Long-term**: Achieve < 50 warnings (only intentional placeholders)

---

## 🔍 Quick Reference Card

### When You See...
| Warning Type | Quick Fix |
|-------------|-----------|
| `'param' is defined but never used` | Prefix with `_param` |
| `React Hook missing dependency` | Move function inside useEffect |
| `'import' is defined but never used` | Remove or alias as `_import` |
| `'variable' is assigned but never used` | Remove or investigate incomplete logic |
| `exhaustive-deps` | Add missing deps or extract to pure function |

### Emergency Fixes
If CI is failing:
1. Check `npm run typecheck` first - TypeScript errors break build
2. Check `npm run lint` - must have < 440 warnings
3. Recent changes often introduce patterns fixed in this guide
4. When in doubt, prefix unused params with underscore
5. Push fixes immediately to unblock team

---

**Last Updated**: 2025-10-09
**Maintainer**: AI Coding Assistant + Development Team
**Status**: ✅ CI PASSING - TypeScript Clean, ESLint Under Limit
