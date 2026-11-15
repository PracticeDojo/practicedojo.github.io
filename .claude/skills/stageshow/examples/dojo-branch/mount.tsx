// Entry for a host page with no bundler: mounts the demo into #dojo-stage.
import { createRoot } from 'react-dom/client'
import DojoBranch from './Scene'

const el = document.getElementById('dojo-stage')
if (el) createRoot(el).render(<DojoBranch />)
