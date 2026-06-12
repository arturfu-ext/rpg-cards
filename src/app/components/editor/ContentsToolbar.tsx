/**
 * Directive insert buttons for the card contents textarea.
 *
 * Port of the legacy "card actions" toolbar (generator/js/ui.js:416-458):
 * actions are grouped by category; each button is labeled with the first word
 * of the directive example, carries the summary as its tooltip, and inserts
 * the full example line into the contents textarea at the cursor.
 */
import { type CardActionInfo, card_action_info } from '@/app/data/card-actions';
import { Button } from '@/components/ui/button';

interface ContentsToolbarProps {
  /** Insert an example line into the contents textarea at the cursor. */
  onInsert: (example: string) => void;
}

interface ActionGroup {
  category: string;
  actions: Array<{ functionName: string; info: CardActionInfo }>;
}

/**
 * Group actions by category, preserving the legacy for-in iteration order
 * (insertion order of card_action_info) for both groups and buttons.
 */
const ACTION_GROUPS: readonly ActionGroup[] = (() => {
  const groups: ActionGroup[] = [];
  const byCategory = new Map<string, ActionGroup>();
  for (const [functionName, info] of Object.entries(card_action_info)) {
    let group = byCategory.get(info.category);
    if (!group) {
      group = { category: info.category, actions: [] };
      byCategory.set(info.category, group);
      groups.push(group);
    }
    group.actions.push({ functionName, info });
  }
  return groups;
})();

export function ContentsToolbar({ onInsert }: ContentsToolbarProps) {
  return (
    <div className="space-y-3">
      {ACTION_GROUPS.map((group) => (
        <div key={group.category}>
          <h4 className="mb-1.5 font-medium text-muted-foreground text-xs">{group.category}</h4>
          <div className="flex flex-wrap gap-1">
            {group.actions.map(({ functionName, info }) => (
              <Button
                key={functionName}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 font-mono text-xs"
                title={info.summary}
                onClick={() => onInsert(info.example)}
              >
                {info.example.split(' ')[0] ?? info.example}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
