import { Editor } from '@monaco-editor/react'
import './App.css'
import { useEffect, useState } from 'react'
import {
  BaseDirectory,
  create,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from '@tauri-apps/plugin-fs'

function App() {
  const [content, setContent] = useState('')

  useEffect(() => {
    const readOrCreateFile = async () => {
      try {
        const dirExists = await exists('', {
          baseDir: BaseDirectory.AppLocalData,
        })
        if (!dirExists) {
          await mkdir('', {
            baseDir: BaseDirectory.AppLocalData,
          })
        }

        const content = await readTextFile('index.md', {
          baseDir: BaseDirectory.AppLocalData,
        })
        setContent(content)
      } catch (error) {
        console.error(error)
        await create('index.md', {
          baseDir: BaseDirectory.AppLocalData,
        })
      }
    }
    readOrCreateFile()
  }, [])

  const saveFile = async () => {
    await writeTextFile('index.md', content, {
      baseDir: BaseDirectory.AppLocalData,
    })
  }

  return (
    <main
      onKeyDown={(e) => {
        if (e.metaKey && e.key === 's') {
          e.preventDefault()
          saveFile()
        }
      }}
    >
      <Editor
        height={'100vh'}
        defaultLanguage='markdown'
        options={{
          wordWrap: 'on',
        }}
        defaultValue={content}
        onChange={(value) => setContent(value ?? '')}
      />
    </main>
  )
}

export default App
