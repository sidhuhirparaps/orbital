import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import { useGuardedAction } from '@/hooks/useGuardedAction'

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'need_help', label: 'Need Help' },
]

function TaskFormModal({ open, onOpenChange, goalId, task = null }) {
  const { user } = useAuth()
  const guard = useGuardedAction()
  const queryClient = useQueryClient()
  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.data.members.list(),
  })

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('pending')
  const [assigneeId, setAssigneeId] = useState(user?.id || '')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title || '')
      setNotes(task.notes || '')
      setStatus(task.status || 'pending')
      setAssigneeId(task.assigneeId || user?.id || '')
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '')
    } else {
      setTitle('')
      setNotes('')
      setStatus('pending')
      setAssigneeId(user?.id || '')
      setDueDate('')
    }
  }, [task, open, user?.id])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        notes,
        status,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        goalId: goalId || task?.goalId,
      }
      if (task) {
        return api.data.tasks.update(task.id, payload)
      }
      return api.data.tasks.create({
        ...payload,
        order: Date.now(),
        checkIns: [],
      })
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
      toast.success(task ? 'Task updated' : 'Task created')
      onOpenChange(false)
    },
    onError: (err) => toast.error(err.message || 'Save failed'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit task' : 'New task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Due date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="neu" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!title.trim() || mutation.isPending}
            onClick={guard(() => mutation.mutate())}
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TaskFormModal
