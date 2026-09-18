import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import * as React from 'react'
import { act } from 'react'

// React 19 compatibility with testing-library
if (!(React as any).act) {
  (React as any).act = act
}

afterEach(() => {
  cleanup()
})

globalThis.IS_REACT_ACT_ENVIRONMENT = true