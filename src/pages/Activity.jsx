import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '@/components/shared/PageHeader'
import PageSkeleton from '@/components/shared/PageSkeleton'
import LiveActivityFeed from '@/components/activity/LiveActivityFeed'
import ActivityItem from '@/components/activity/ActivityItem'
import { api } from '@/api/client'

function Activity() {
  const { data: updates = [], isLoading: uLoading } = useQuery({
    queryKey: ['updates'],
    queryFn: () => api.data.updates.list(),
  })
  const { data: agentActivity = [], isLoading: aLoading } = useQuery({
    queryKey: ['agent_activity'],
    queryFn: () => api.data.agent_activity.list(),
  })
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.data.agents.list(),
  })
  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.data.members.list(),
  })

  const sortedUpdates = useMemo(
    () => [...updates].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [updates],
  )

  const sortedAgent = useMemo(
    () => [...agentActivity].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [agentActivity],
  )

  const agentMap = useMemo(
    () => Object.fromEntries(agents.map((a) => [a.id, a.name])),
    [agents],
  )

  if (uLoading || aLoading) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Activity"
        description="Live feed of human updates and autonomous agent actions."
      />

      <LiveActivityFeed
        updates={sortedUpdates}
        members={members}
        agents={agents}
        nextPlannedAction={agents[0]?.nextPlannedAction}
      />

      <div className="neu-raised p-5">
        <h2 className="mb-4 text-base font-semibold">Agent timeline</h2>
        {sortedAgent.map((item, i) => (
          <ActivityItem
            key={item.id}
            item={item}
            actorName={agentMap[item.agentId] || 'Agent'}
            isAgent
            index={i}
          />
        ))}
      </div>
    </div>
  )
}

export default Activity
