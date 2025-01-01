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
  const titleRef = useRef('')

  useEffect(() => {
    const initialize = async () => {
      try {
        const dirExists = await exists('', {
          baseDir: BaseDirectory.AppLocalData,
        })
        if (!dirExists) {
          await mkdir('', {
            baseDir: BaseDirectory.AppLocalData,
          })
        }

        const initialContent = await readTextFile('index.md', {
          baseDir: BaseDirectory.AppLocalData,
        })
        setContent(initialContent)
      } catch (error) {
        console.error(error)
        await create('index.md', {
          baseDir: BaseDirectory.AppLocalData,
        })
      }

      titleRef.current = await getCurrentWindow().title()
    }
    initialize()
  }, [])

  const toggleSaveStatus = async (
    saved: boolean,
    error: unknown | null = null
  ) => {
    savedRef.current = saved

    if (error) {
      console.error(error)
      await getCurrentWindow().setTitle(`${titleRef.current} ×`)
      return
    }

    if (saved) {
      await getCurrentWindow().setTitle(titleRef.current)
    } else {
      await getCurrentWindow().setTitle(`${titleRef.current} *`)
    }
  }

  const handleSave = async () => {
    try {
      setContent(currentContentRef.current)
      await writeTextFile('index.md', currentContentRef.current, {
        baseDir: BaseDirectory.AppLocalData,
      })

      toggleSaveStatus(true)
    } catch (error) {
      toggleSaveStatus(false, error)
    }
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
