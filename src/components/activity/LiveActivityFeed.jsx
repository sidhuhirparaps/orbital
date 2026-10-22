import { Activity } from 'lucide-react'
import ActivityItem from '@/components/activity/ActivityItem'
import EmptyState from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

/**
 * When `scrollable`, the list scrolls inside the panel.
 * - Default: height-capped (dashboard side-by-side).
 * - `fill`: grows with parent flex height (activity page — no page scroll).
 * Header + next-planned stay pinned above the scroll region.
 */
function LiveActivityFeed({
  updates = [],
  members = [],
  agents = [],
  nextPlannedAction,
  emptyTitle = 'No activity yet. Create a goal to get started.',
  scrollable = false,
  fill = false,
  className,
}) {
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m.name]))
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a.name]))

  return (
    <div
      className={cn(
        'neu-inset flex flex-col overflow-hidden p-5 sm:p-6',
        scrollable &&
          !fill &&
          'min-h-0 max-h-[28rem] lg:max-h-[min(36rem,calc(100vh-14rem))]',
        scrollable && fill && 'min-h-0 flex-1',
        className,
      )}
    >
      <div className="mb-4 shrink-0">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
          Agent Activity
        </h2>
      </div>

      {nextPlannedAction ? (
        <div className="mb-5 shrink-0">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
            Next Planned Action
          </p>
          <div className="neu-raised-sm rounded-[12px] px-4 py-3 text-sm text-foreground">
            {nextPlannedAction}
          </div>
        </div>
      ) : null}

      {updates.length === 0 ? (
        <EmptyState icon={Activity} title={emptyTitle} />
      ) : (
        <div
          className={cn(
            'space-y-1',
            scrollable && 'min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1',
          )}
        >
          {updates.map((item, i) => {
            const isAgent = Boolean(agentMap[item.actorId] || agentMap[item.agentId])
            const actorName =
              memberMap[item.actorId] ||
              agentMap[item.actorId] ||
              agentMap[item.agentId] ||
              'Someone'
            return (
              <ActivityItem
                key={item.id}
                item={item}
                actorName={actorName}
                isAgent={isAgent}
                index={i}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LiveActivityFeed
