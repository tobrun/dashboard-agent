import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { Picker } from './components/Picker'
import { Dashboard } from './components/Dashboard'
import { Preview } from './components/Preview'

function DashboardPage() {
  const { slug } = useParams<{ slug: string }>()
  return <Dashboard slug={slug!} />
}

function PreviewPage() {
  const { slug } = useParams<{ slug: string }>()
  return <Preview slug={slug} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Picker />} />
        <Route path="/d/:slug" element={<DashboardPage />} />
        <Route path="/d/:slug/preview" element={<PreviewPage />} />
      </Routes>
    </BrowserRouter>
  )
}
