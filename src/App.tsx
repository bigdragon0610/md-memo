import { Editor } from '@monaco-editor/react'
import './App.css'
import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react'
import {
  BaseDirectory,
  create,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from '@tauri-apps/plugin-fs'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { Command } from '@tauri-apps/plugin-shell'

function App() {
  const [content, setContent] = useState('')
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on')
  const currentContentRef = useRef('')
  const savedRef = useRef(true)
  const titleRef = useRef('')
  const fileNameRef = useRef('')

  useEffect(() => {
    const initialize = async () => {
      fileNameRef.current = await invoke('get_file_name')

      try {
        const dirExists = await exists('', {
          baseDir: BaseDirectory.AppLocalData,
        })
        if (!dirExists) {
          await mkdir('', {
            baseDir: BaseDirectory.AppLocalData,
          })
        }

        const initialContent = await readTextFile(fileNameRef.current, {
          baseDir: BaseDirectory.AppLocalData,
        })
        setContent(initialContent)
      } catch (error) {
        console.error(error)
        await create(fileNameRef.current, {
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
      await writeTextFile(fileNameRef.current, currentContentRef.current, {
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

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.metaKey && e.key === 's') {
      e.preventDefault()
      handleSave()
    } else if (e.altKey && e.code === 'KeyZ') {
      e.preventDefault()
      setWordWrap((prev) => (prev === 'on' ? 'off' : 'on'))
    }
  }

  const handleClick = async (e: MouseEvent) => {
    if (
      e.metaKey &&
      e.target instanceof HTMLSpanElement &&
      e.target.classList.contains('detected-link-active') &&
      e.target.textContent
    ) {
      e.preventDefault()
      if (!e.target.parentNode) return
      const url = Array.from(e.target.parentNode.childNodes)
        .map((node) => {
          if (
            node instanceof HTMLSpanElement &&
            node.classList.contains('detected-link-active')
          ) {
            return node.textContent
          }
        })
        .join('')
      await Command.create('exec-sh', ['-c', `open ${url}`]).execute()
    }
  }

  return (
    <main onKeyDown={handleKeyDown} onClick={handleClick}>
      <Editor
        height={'100vh'}
        defaultLanguage='markdown'
        options={{
          wordWrap,
        }}
        defaultValue={content}
        onChange={handleChange}
      />
    </main>
  )
}

export default App
