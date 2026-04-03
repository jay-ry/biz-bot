'use client'

import { CopilotKit } from '@copilotkit/react-core'
import { CopilotChat } from '@copilotkit/react-ui'
import '@copilotkit/react-ui/styles.css'

interface Props {
  orgToken: string
  botName?: string
  brandColor?: string
  apiUrl?: string
}

export function ChatWidget({ orgToken, botName, apiUrl }: Props) {
  const runtimeUrl = `${apiUrl ?? ''}/api/copilotkit?token=${encodeURIComponent(orgToken)}`

  return (
    <CopilotKit runtimeUrl={runtimeUrl}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
        <CopilotChat
          labels={{
            title: botName ?? 'Assistant',
            initial: `Hi! I'm ${botName ?? 'your assistant'}. How can I help you today?`,
          }}
          className="flex-1"
        />
      </div>
    </CopilotKit>
  )
}
