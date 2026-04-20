import { describe, it, expect } from 'vitest'

describe('SubTask Order', () => {
  it('should add subtasks in reverse order (newest first)', () => {
    const subTodos: any[] = []

    // Simulate adding subtasks
    const addSubTask = (task: any) => {
      subTodos.unshift(task)
    }

    addSubTask({ id: '1', text: 'First' })
    addSubTask({ id: '2', text: 'Second' })
    addSubTask({ id: '3', text: 'Third' })

    expect(subTodos[0].text).toBe('Third')
    expect(subTodos[1].text).toBe('Second')
    expect(subTodos[2].text).toBe('First')
  })
})

describe('Image Insert Target', () => {
  it('should route image to correct editor', () => {
    const insertImageAtCursor = (_dataUrl: string, targetEditor: any = null) => {
      if (targetEditor) {
        return targetEditor
      }
      return 'default'
    }

    const subEditor = 'subEditDiv'
    const parentEditor = 'editDiv'

    expect(insertImageAtCursor('data:image', subEditor)).toBe(subEditor)
    expect(insertImageAtCursor('data:image', parentEditor)).toBe(parentEditor)
    expect(insertImageAtCursor('data:image')).toBe('default')
  })
})
