import { Editor } from '@monaco-editor/react'
import './App.css'
import { useEffect, useRef, useState } from 'react'
import {
  BaseDirectory,
  create,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from '@tauri-apps/plugin-fs'
import { getCurrentWindow } from '@tauri-apps/api/window'

function App() {
  const [content, setContent] = useState('')
  const currentContentRef = useRef('')
  const savedRef = useRef(true)

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

  const toggleSaveStatus = async (saved: boolean) => {
    const window = getCurrentWindow()
    const title = await window.title()
    if (saved) {
      await getCurrentWindow().setTitle(title.replace(' *', ''))
    } else {
      await getCurrentWindow().setTitle(`${title} *`)
    }
    savedRef.current = saved
  }

  const handleSave = async () => {
    setContent(currentContentRef.current)
    await writeTextFile('index.md', currentContentRef.current, {
      baseDir: BaseDirectory.AppLocalData,
    })

    toggleSaveStatus(true)
  }

  const handleChange = async (value: string | undefined) => {
    if (value === undefined) return
    currentContentRef.current = value

    if (value !== content && savedRef.current) {
      toggleSaveStatus(false)
    } else if (value === content) {
      toggleSaveStatus(true)
    }
  }

  return (
    <main
      onKeyDown={(e) => {
        if (e.metaKey && e.key === 's') {
          e.preventDefault()
          handleSave()
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
        onChange={handleChange}
      />
    </main>
  )
}

export default App
