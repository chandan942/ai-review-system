import './index.css'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-card/50 backdrop-blur-sm p-4">
        <h1 className="text-2xl font-bold">AI Code Reviewer</h1>
      </header>
      <main className="flex-1 flex p-6 gap-6">
        <div className="flex-1">Code Editor Placeholder</div>
        <div className="flex-1">Review Dashboard Placeholder</div>
      </main>
    </div>
  )
}

export default App