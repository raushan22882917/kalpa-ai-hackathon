# AI File Manager Chat - Flow Diagrams

## @ Mention Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Types in Chat                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Contains "@"?  │
                    └─────────────────┘
                         │         │
                    Yes  │         │  No
                         ▼         ▼
            ┌──────────────────┐  Continue
            │ Extract Text     │  Normal Input
            │ After "@"        │
            └──────────────────┘
                         │
                         ▼
            ┌──────────────────────┐
            │ Get All Files        │
            │ Recursively          │
            └──────────────────────┘
                         │
                         ▼
            ┌──────────────────────┐
            │ Filter by Text       │
            │ (Case Insensitive)   │
            └──────────────────────┘
                         │
                         ▼
            ┌──────────────────────┐
            │ Show Dropdown        │
            │ (Max 10 Results)     │
            └──────────────────────┘
                         │
                         ▼
            ┌──────────────────────┐
            │ User Clicks File     │
            └──────────────────────┘
                         │
                         ▼
            ┌──────────────────────┐
            │ Insert @path         │
            │ Into Input           │
            └──────────────────────┘
                         │
                         ▼
            ┌──────────────────────┐
            │ User Completes       │
            │ Command              │
            └──────────────────────┘
```

## File Update Flow

```
┌─────────────────────────────────────────────────────────────┐
│         User: "Update @src/App.tsx to add routing"          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Parse Intent    │
                    │ Action: UPDATE  │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Extract Mention │
                    │ @src/App.tsx    │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ File Exists?    │
                    └─────────────────┘
                         │         │
                    Yes  │         │  No
                         ▼         ▼
            ┌──────────────────┐  Show Error
            │ Read Current     │  "File not found"
            │ Content          │
            └──────────────────┘
                         │
                         ▼
            ┌──────────────────────┐
            │ Generate Updated     │
            │ Content Based on     │
            │ Instruction          │
            └──────────────────────┘
                         │
                         ▼
            ┌──────────────────────┐
            │ Write Updated        │
            │ Content to File      │
            └──────────────────────┘
                         │
                         ▼
            ┌──────────────────────┐
            │ Show Success         │
            │ Message              │
            └──────────────────────┘
```

## File Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│      User: "Create a React component called Button"         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Parse Intent    │
                    │ Action: CREATE  │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Extract Name    │
                    │ "Button"        │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Detect Type     │
                    │ "component"     │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Generate Path   │
                    │ Button.tsx      │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ File Exists?    │
                    └─────────────────┘
                         │         │
                    No   │         │  Yes
                         ▼         ▼
            ┌──────────────────┐  Show Error
            │ Generate Code    │  "Already exists"
            │ Based on Type    │
            └──────────────────┘
                         │
                         ▼
            ┌──────────────────────┐
            │ Create File with     │
            │ Generated Content    │
            └──────────────────────┘
                         │
                         ▼
            ┌──────────────────────┐
            │ Show Success         │
            │ + Preview Code       │
            └──────────────────────┘
```

## Project Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│      User: "Generate a React project structure"             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Parse Intent    │
                    │ Action: GEN     │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Detect Project  │
                    │ Type: "React"   │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Load Template   │
                    │ Structure       │
                    └─────────────────┘
                              │
                              ▼
            ┌──────────────────────────┐
            │ For Each Item:           │
            │ - Create Folder          │
            │ - Create File            │
            │ - Generate Content       │
            └──────────────────────────┘
                              │
                              ▼
            ┌──────────────────────────┐
            │ Track Results:           │
            │ - Success Count          │
            │ - Error Count            │
            │ - Created Items          │
            └──────────────────────────┘
                              │
                              ▼
            ┌──────────────────────────┐
            │ Show Summary             │
            │ + Action List            │
            └──────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   AIFileManagerChat                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Chat Header                            │    │
│  │  - Title                                            │    │
│  │  - Current Path                                     │    │
│  │  - AI Model Selector                                │    │
│  │  - Close Button                                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Chat Messages                          │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ System Message                           │      │    │
│  │  │ - Welcome text                           │      │    │
│  │  │ - Instructions                           │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ User Message                             │      │    │
│  │  │ - User input                             │      │    │
│  │  │ - Timestamp                              │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ Assistant Message                        │      │    │
│  │  │ - AI response                            │      │    │
│  │  │ - Action results                         │      │    │
│  │  │ - Timestamp                              │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  │                                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Input Container                        │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ Quick Action Buttons                     │      │    │
│  │  │ [📄] [📁] [🚀] [⚛️] [✏️]                │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ File Suggestions Dropdown (if @ typed)   │      │    │
│  │  │ ┌────────────────────────────────────┐   │      │    │
│  │  │ │ 📄 src/App.tsx            [file]   │   │      │    │
│  │  │ │ 📁 src/components    [directory]   │   │      │    │
│  │  │ │ 📄 src/index.tsx          [file]   │   │      │    │
│  │  │ └────────────────────────────────────┘   │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ Text Input                               │      │    │
│  │  │ "Tell me what to do..."                  │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │ Send Button                              │      │    │
│  │  │ [🚀 Send]                                │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  │                                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    Component State                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  messages: ChatMessage[]                                     │
│  ├─ id: string                                               │
│  ├─ role: 'user' | 'assistant' | 'system'                   │
│  ├─ content: string                                          │
│  ├─ timestamp: Date                                          │
│  ├─ actions?: FileAction[]                                   │
│  └─ mentionedFiles?: string[]                               │
│                                                              │
│  inputValue: string                                          │
│  isProcessing: boolean                                       │
│  selectedModel: AIModel                                      │
│  showSuggestions: boolean                                    │
│  fileSuggestions: FileSuggestion[]                          │
│  cursorPosition: number                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Input
    │
    ▼
handleInputChange()
    │
    ├─► Check for "@"
    │   │
    │   ├─► extractMentions()
    │   │
    │   ├─► getAllFiles()
    │   │
    │   └─► setFileSuggestions()
    │
    ▼
handleSendMessage()
    │
    ├─► parseUserIntent()
    │   │
    │   ├─► Detect action type
    │   │
    │   └─► Extract targets
    │
    ├─► executeFileAction()
    │   │
    │   ├─► fileSystem.createFile()
    │   ├─► fileSystem.createDirectory()
    │   ├─► fileSystem.updateFile()
    │   ├─► fileSystem.delete()
    │   └─► fileSystem.rename()
    │
    └─► addAssistantMessage()
        │
        └─► Update UI with results
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    Application                               │
│                                                              │
│  ┌────────────────┐         ┌────────────────┐             │
│  │  Activity Bar  │────────▶│    Sidebar     │             │
│  │                │         │                │             │
│  │  [💬 Chat]     │         │  ┌──────────┐  │             │
│  └────────────────┘         │  │   AI     │  │             │
│                              │  │   File   │  │             │
│                              │  │ Manager  │  │             │
│                              │  │   Chat   │  │             │
│                              │  └──────────┘  │             │
│                              │       │        │             │
│                              └───────┼────────┘             │
│                                      │                      │
│                                      ▼                      │
│                              ┌────────────────┐             │
│                              │  File System   │             │
│                              │    Service     │             │
│                              └────────────────┘             │
│                                      │                      │
│                                      ▼                      │
│                              ┌────────────────┐             │
│                              │  Virtual FS    │             │
│                              │  or Native FS  │             │
│                              └────────────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

These diagrams illustrate the complete flow and architecture of the AI File Manager Chat system.
