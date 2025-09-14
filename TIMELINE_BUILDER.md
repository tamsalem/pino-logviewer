# Event Timeline Builder

The Event Timeline Builder is a powerful feature that transforms your log viewer into an investigation tool, allowing you to build a detective case file from raw logs.

## Features

### 🎯 **Drag & Drop Interface**
- **Drag any log entry** from the main view to the timeline panel
- **Visual drag feedback** with custom drag images showing log level and message
- **Grip handle indicator** on draggable log entries
- **Smooth animations** for adding events to the timeline

### 📋 **Timeline Cards**
Each selected log becomes a **chronological card** displaying:
- **Timestamp** with precise formatting
- **Log level** with color-coded badges
- **Message** with full text
- **Expandable JSON details** with syntax highlighting
- **Copy functionality** for raw data and JSON

### 📝 **Annotations & Notes**
- **Add notes directly** to each timeline event
- **Edit annotations** inline with keyboard shortcuts (Enter to save, Escape to cancel)
- **Delete notes** with confirmation
- **Timestamp tracking** for when notes were added/updated
- **Contextual annotations** like "retry triggered here" or "unexpected null here"

### 🔄 **Reordering & Management**
- **Chronological default ordering** based on log timestamps
- **Manual reordering** capability (drag handles on cards)
- **Remove events** from timeline
- **Clear entire timeline** with confirmation

### 📊 **Investigation Summary**
- **Real-time statistics** showing error/warning/info/debug counts
- **Time range analysis** of selected events
- **Event counter** in the toolbar with visual indicator

### 📤 **Export Capabilities**
Generate ready-made investigation reports in two formats:

#### **Markdown Export**
- Professional investigation report format
- Event timeline with full details
- Annotations and notes included
- Summary statistics
- Time range analysis

#### **JSON Export**
- Structured data format
- Complete event data with annotations
- Metadata including creation date and summary
- Machine-readable format for further analysis

## How to Use

### 1. **Opening the Timeline Panel**
- Click the **Clock icon** in the toolbar to open the Event Timeline Builder
- The panel slides in from the right side
- A red badge shows the number of events when timeline has content

### 2. **Adding Events to Timeline**
- **Drag any log entry** from the main log view to the timeline panel
- Look for the **grip handle** (⋮⋮) next to log entries - this indicates they're draggable
- The cursor changes to indicate draggable items
- A custom drag image shows the log level and message preview

### 3. **Managing Timeline Events**
- **Expand cards** to see full log details and JSON data
- **Add notes** by clicking the "Add Note" button
- **Edit notes** by clicking the edit icon on existing annotations
- **Remove events** using the X button on each card
- **Clear all events** using the "Clear" button in the panel

### 4. **Exporting Investigation Reports**
- Click the **"Export"** button in the timeline panel
- Choose format: **Markdown** (human-readable) or **JSON** (machine-readable)
- Select options:
  - Include annotations/notes
  - Include raw log data
- Download the investigation report

## Technical Implementation

### **Architecture**
- **React Context** for global timeline state management
- **TypeScript** for type safety and better developer experience
- **Framer Motion** for smooth animations
- **HTML5 Drag & Drop API** for native drag functionality
- **Tailwind CSS** for consistent styling

### **State Management**
```typescript
interface TimelineState {
  events: TimelineEvent[];
  isPanelOpen: boolean;
  selectedEventId: string | null;
}
```

### **Key Components**
- `TimelineProvider` - Context provider for timeline state
- `TimelinePanel` - Main sidebar component
- `TimelineCard` - Individual event cards
- `TimelineBuilder` - Main orchestrator component

### **Export System**
- `exportTimelineToMarkdown()` - Generates Markdown reports
- `exportTimelineToJSON()` - Generates JSON reports
- Configurable options for content inclusion

## Use Cases

### **Incident Investigation**
1. Load log file with errors
2. Drag error logs to timeline
3. Add contextual notes ("Database connection failed", "Retry attempted")
4. Export investigation report for team review

### **Performance Analysis**
1. Filter logs by time range
2. Drag performance-related logs to timeline
3. Annotate with observations ("Response time spike", "Memory usage high")
4. Export timeline for performance team

### **Debugging Sessions**
1. Focus on specific error patterns
2. Build chronological sequence of events
3. Add debugging notes and hypotheses
4. Share investigation with development team

## Benefits

- **🎯 Focused Investigation** - Build targeted timelines from large log files
- **📝 Contextual Documentation** - Add your own insights and observations
- **📊 Professional Reports** - Generate shareable investigation documents
- **🔄 Flexible Workflow** - Easy to modify and reorder as investigation progresses
- **💾 Persistent State** - Timeline persists while navigating the application
- **⚡ Performance** - Efficient rendering with React optimizations

The Event Timeline Builder transforms your log viewer from a simple file reader into a powerful investigation and analysis tool, perfect for debugging, incident response, and performance analysis.
