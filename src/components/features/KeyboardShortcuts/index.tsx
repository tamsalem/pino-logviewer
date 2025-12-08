import { Keyboard } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
} from '../../../../components/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip';
import { KEYBOARD_SHORTCUTS } from '../../../constants';

export default function KeyboardShortcuts() {
  return (
    <TooltipProvider delayDuration={500}>
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                style={{ color: 'var(--logviewer-text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Keyboard className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent
            className="px-2 py-1 text-xs rounded"
            style={{
              backgroundColor: 'var(--logviewer-bg-elevated)',
              color: 'var(--logviewer-text-primary)',
              border: `1px solid var(--logviewer-border-primary)`,
            }}
          >
            <p>Keyboard shortcuts</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent
          className="w-[500px] max-h-[600px] overflow-y-auto"
          align="end"
          style={{
            backgroundColor: 'var(--logviewer-bg-elevated)',
            border: `1px solid var(--logviewer-border-primary)`,
            color: 'var(--logviewer-text-primary)',
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--logviewer-border-primary)' }}>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--logviewer-text-primary)' }}>
                Keyboard Shortcuts
              </h3>
            </div>
            <div className="space-y-6 py-2">
              {KEYBOARD_SHORTCUTS.map((category) => (
                <div key={category.category}>
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: 'var(--logviewer-accent-primary)' }}
                  >
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 px-3 rounded"
                        style={{ backgroundColor: 'var(--logviewer-bg-tertiary)' }}
                      >
                        <span
                          className="text-sm"
                          style={{ color: 'var(--logviewer-text-primary)' }}
                        >
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIdx) => (
                            <span key={keyIdx} className="flex items-center gap-1">
                              <kbd
                                className="px-2 py-1 text-xs font-semibold rounded"
                                style={{
                                  backgroundColor: 'var(--logviewer-bg-secondary)',
                                  border: `1px solid var(--logviewer-border-primary)`,
                                  color: 'var(--logviewer-text-primary)',
                                }}
                              >
                                {key}
                              </kbd>
                              {keyIdx < shortcut.keys.length - 1 && (
                                <span
                                  className="text-xs mx-1"
                                  style={{ color: 'var(--logviewer-text-secondary)' }}
                                >
                                  +
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}