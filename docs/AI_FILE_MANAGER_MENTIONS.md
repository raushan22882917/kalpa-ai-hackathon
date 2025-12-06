# @ Mention Feature - Quick Reference

## Overview

The @ mention feature in AI File Manager Chat allows you to reference specific files and folders in your workspace, enabling precise file operations and updates.

## How It Works

### 1. Triggering Suggestions

Type `@` anywhere in your message to trigger the file suggestion dropdown:

```
Update @
```

### 2. Filtering Files

Continue typing after `@` to filter the file list:

```
Update @src/
Update @components/
Update @App
```

The suggestions update in real-time as you type.

### 3. Selecting a File

Click on any file in the dropdown to insert it into your message:

```
Update @src/App.tsx
```

### 4. Multiple Mentions

You can mention multiple files in one message:

```
Update @src/App.tsx and @src/styles.css to match the new theme
```

## Common Use Cases

### File Updates

```
"Update @src/App.tsx to add a navigation bar"
"Add error handling to @src/services/api.ts"
"Refactor @components/Button.tsx to use TypeScript"
"Fix the authentication bug in @src/auth/login.ts"
```

### Code Review

```
"Review @src/utils/helpers.ts for best practices"
"Check @components/UserProfile.tsx for accessibility issues"
"Analyze @src/services/database.ts for performance"
```

### Code Explanation

```
"Explain what @src/config.ts does"
"What is the purpose of @utils/validation.ts?"
"Describe the logic in @components/Dashboard.tsx"
```

### Refactoring

```
"Refactor @src/legacy/old-api.ts to use modern syntax"
"Modernize @components/ClassComponent.tsx to use hooks"
"Split @src/utils/helpers.ts into smaller modules"
```

### Adding Features

```
"Add dark mode support to @src/App.tsx"
"Implement caching in @src/services/api.ts"
"Add form validation to @components/ContactForm.tsx"
```

### Bug Fixes

```
"Fix the memory leak in @components/DataTable.tsx"
"Resolve the type error in @src/types/user.ts"
"Fix the infinite loop in @hooks/useData.ts"
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Trigger suggestions | Type `@` |
| Navigate suggestions | `↑` `↓` arrows |
| Select suggestion | `Enter` or Click |
| Close suggestions | `Esc` |
| Continue typing | Any character |

## File Suggestion Display

Each suggestion shows:

- **Icon** - 📁 for folders, 📄 for files
- **Path** - Full relative path from workspace root
- **Type** - "file" or "directory" label

Example:
```
📄 src/components/Button.tsx    [file]
📁 src/components               [directory]
📄 src/App.tsx                  [file]
```

## Tips & Tricks

### 1. Start with @
Always start your file reference with `@` to trigger autocomplete:
- ✅ `@src/App.tsx`
- ❌ `src/App.tsx` (won't trigger suggestions)

### 2. Use Partial Paths
You don't need to type the full path - suggestions filter as you type:
- Type `@App` → Shows all files with "App" in the name
- Type `@src/c` → Shows all files in src starting with "c"

### 3. Folders vs Files
You can mention both folders and files:
- `@src/components` - Reference a folder
- `@src/components/Button.tsx` - Reference a specific file

### 4. Case Insensitive
File filtering is case-insensitive:
- `@app` will find `App.tsx`
- `@BUTTON` will find `button.tsx`

### 5. Multiple Operations
Mention multiple files for batch operations:
```
"Update @src/App.tsx, @src/index.css, and @public/index.html to use the new branding"
```

## What Happens When You Mention a File

1. **File Validation** - AI checks if the file exists
2. **Content Reading** - Current file content is loaded
3. **Context Analysis** - AI understands the file structure
4. **Smart Updates** - Changes are applied intelligently
5. **Confirmation** - You receive feedback on the operation

## Error Handling

### File Not Found
```
❌ File not found: @src/NonExistent.tsx

Please check the file path and try again.
```

**Solution:** Use the @ autocomplete to ensure correct paths

### Permission Denied
```
❌ Cannot modify file: @system/protected.ts

This file is read-only or protected.
```

**Solution:** Check file permissions or choose a different file

### Invalid Path
```
❌ Invalid file path: @../outside/workspace.ts

Files must be within the workspace.
```

**Solution:** Only reference files within your workspace

## Advanced Usage

### Conditional Updates
```
"If @src/config.ts has a production flag, update @src/App.tsx to use production API"
```

### Dependency Analysis
```
"List all files that import @src/utils/helpers.ts"
```

### Code Migration
```
"Move the authentication logic from @src/App.tsx to @src/auth/AuthProvider.tsx"
```

### Pattern Matching
```
"Update all @components/*.tsx files to use the new theme"
```

## Integration with Other Features

### With File Explorer
- Files mentioned with @ are highlighted in the File Explorer
- Click on files in Explorer to auto-insert @ mentions

### With Recent Files
- Recently mentioned files appear in Quick Actions
- Access frequently updated files faster

### With Search
- Search results can be mentioned with @
- Find and update files in one workflow

## Best Practices

### 1. Be Specific
✅ "Update @src/components/Header.tsx to add a logo"
❌ "Update the header to add a logo"

### 2. One File Per Operation
For complex changes, update one file at a time:
```
"Update @src/App.tsx to import the new Header component"
```
Then:
```
"Update @src/components/Header.tsx to export the component"
```

### 3. Verify Before Updating
Check file content before major changes:
```
"Show me the current content of @src/config.ts"
```
Then:
```
"Update @src/config.ts to add the new API endpoint"
```

### 4. Use Descriptive Instructions
Be clear about what you want:
✅ "Add a useState hook for theme toggle in @src/App.tsx"
❌ "Add state to @src/App.tsx"

### 5. Review Changes
After updates, verify the changes:
```
"Show me what changed in @src/App.tsx"
```

## Troubleshooting

### Suggestions Not Appearing
- Ensure you typed `@` character
- Check that files exist in your workspace
- Try typing more characters to filter

### Wrong File Selected
- Use more specific paths: `@src/components/Button.tsx` instead of `@Button`
- Check the file type indicator (file vs directory)

### Update Not Applied
- Verify file exists and is writable
- Check for syntax errors in your instruction
- Try breaking complex updates into smaller steps

## Future Enhancements

Coming soon:
- Multi-file diff preview before applying changes
- Undo/redo for @ mention operations
- File history and version control integration
- Smart suggestions based on file relationships
- Bulk operations with pattern matching

---

**Master the @ mention feature to supercharge your file management workflow! 🚀**
