/**
 * Activity Bar Component
 * Left sidebar with icons for different views (like VS Code)
 */

import { 
  FolderOpen, 
  Search, 
  GitBranch, 
  Bug, 
  Puzzle, 
  Zap, 
  Clock, 
  Globe, 
  MessageSquare, 
  Settings,
  Users,
  GitPullRequest,
  CheckSquare,
  Workflow,
  Rocket,
  Terminal
} from 'lucide-react';
import './ActivityBar.css';

export type ActivityView = 'explorer' | 'search' | 'source-control' | 'debug' | 'extensions' | 'recent' | 'chat' | 'preview' | 'supabase' | 'organizations' | 'bitbucket' | 'jira' | 'workflow' | 'deployment' | 'terminal';

export interface ActivityBarProps {
  activeView: ActivityView;
  onViewChange: (view: ActivityView) => void;
  chatVisible: boolean;
  onChatToggle: () => void;
  previewVisible: boolean;
  onPreviewToggle: () => void;
  theme?: 'light' | 'dark';
}

const ActivityBar = ({ activeView, onViewChange, chatVisible, onChatToggle, previewVisible, onPreviewToggle, theme = 'dark' }: ActivityBarProps) => {
  const activities = [
    { id: 'explorer' as ActivityView, Icon: FolderOpen, label: 'Explorer', shortcut: 'Ctrl+Shift+E' },
    { id: 'search' as ActivityView, Icon: Search, label: 'Search', shortcut: 'Ctrl+Shift+F' },
    { id: 'workflow' as ActivityView, Icon: Workflow, label: 'Development Workflow', shortcut: 'Ctrl+Shift+W' },
    { id: 'source-control' as ActivityView, Icon: GitBranch, label: 'Source Control (GitHub)', shortcut: 'Ctrl+Shift+G' },
    { id: 'bitbucket' as ActivityView, Icon: GitPullRequest, label: 'Bitbucket', shortcut: 'Ctrl+Shift+B' },
    { id: 'jira' as ActivityView, Icon: CheckSquare, label: 'Jira Tasks', shortcut: 'Ctrl+Shift+J' },
    { id: 'organizations' as ActivityView, Icon: Users, label: 'Organizations', shortcut: 'Ctrl+Shift+O' },
    { id: 'debug' as ActivityView, Icon: Bug, label: 'Run and Debug', shortcut: 'Ctrl+Shift+D' },
    { id: 'extensions' as ActivityView, Icon: Puzzle, label: 'Extensions Marketplace', shortcut: 'Ctrl+Shift+X' },
    { id: 'supabase' as ActivityView, Icon: Zap, label: 'Supabase', shortcut: 'Ctrl+Shift+S' },
    { id: 'deployment' as ActivityView, Icon: Rocket, label: 'Deploy', shortcut: 'Ctrl+Shift+P' },
    { id: 'recent' as ActivityView, Icon: Clock, label: 'Recent Files', shortcut: 'Ctrl+Shift+R' },
    { id: 'terminal' as ActivityView, Icon: Terminal, label: 'Terminal', shortcut: 'Ctrl+`' },
  ];

  return (
    <div className={`activity-bar ${theme}`}>
      <div className="activity-bar-items">
        {activities.map((activity) => {
          const IconComponent = activity.Icon;
          return (
            <button
              key={activity.id}
              className={`activity-bar-item ${activeView === activity.id ? 'active' : ''}`}
              onClick={() => onViewChange(activity.id)}
              title={`${activity.label} (${activity.shortcut})`}
            >
              <IconComponent className="activity-icon" size={20} />
            </button>
          );
        })}
      </div>
      <div className="activity-bar-bottom">
        <button 
          className={`activity-bar-item ${previewVisible ? 'active' : ''}`}
          title="Live Preview (Ctrl+Shift+V)"
          onClick={onPreviewToggle}
        >
          <Globe className="activity-icon" size={20} />
        </button>
        <button 
          className={`activity-bar-item ${chatVisible ? 'active' : ''}`}
          title="AI Chat (Ctrl+Shift+A)"
          onClick={onChatToggle}
        >
          <MessageSquare className="activity-icon" size={20} />
        </button>
        <button 
          className="activity-bar-item" 
          title="Settings"
          onClick={() => {
            // Open settings window
            window.dispatchEvent(new Event('open-settings-window'));
          }}
        >
          <Settings className="activity-icon" size={20} />
        </button>
      </div>
    </div>
  );
};

export default ActivityBar;
