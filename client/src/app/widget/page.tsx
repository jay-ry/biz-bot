import { Suspense } from 'react'
import { ChatWidgetLoader } from '@/components/widget/chat-widget-loader'

export default function WidgetPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16, color: '#9ca3af' }}>Loading...</div>}>
      <ChatWidgetLoader />
    </Suspense>
  )
}
