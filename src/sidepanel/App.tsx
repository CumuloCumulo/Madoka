import { ChatProvider } from './context/ChatContext'
import { Header } from './components/Header'
import { MessageList } from './components/MessageList'
import { InputArea } from './components/InputArea'
import { SettingsPanel } from './components/SettingsPanel'
import { useChatContext } from './context/ChatContext'
import { AnimatePresence } from 'framer-motion'

function AppContent() {
  const { state } = useChatContext()
  const { view, isResponding } = state

  return (
    <div className="flex flex-col h-screen bg-madoka-bg">
      {/* 标题栏 - 回答时隐藏 */}
      <AnimatePresence>
        {!isResponding && view === 'chat' && <Header />}
      </AnimatePresence>

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
        {view === 'chat' ? (
          <MessageList />
        ) : (
          <SettingsPanel />
        )}
      </main>

      {/* 输入区域 */}
      {view === 'chat' && <InputArea />}
    </div>
  )
}

export default function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  )
}
