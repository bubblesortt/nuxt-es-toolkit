import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

type WorkflowStep = {
  name?: string
  run?: string
}

type CiWorkflow = {
  jobs: {
    quality: {
      steps: WorkflowStep[]
    }
  }
}

function findStep(steps: WorkflowStep[], name: string) {
  const index = steps.findIndex(step => step.name === name)

  expect(index, `expected a ${name} step`).toBeGreaterThanOrEqual(0)
  return { index, step: steps[index]! }
}

describe('CI workflow', () => {
  it('guards compiled output between package build and publint', () => {
    const workflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8')) as CiWorkflow
    const steps = workflow.jobs.quality.steps
    const build = findStep(steps, 'Build package')
    const guard = findStep(steps, 'Check module output')
    const publint = findStep(steps, 'Validate package')

    expect(build.step.run).toBe('pnpm prepack')
    expect(guard.step.run).toBe('pnpm check:module-output')
    expect(publint.step.run).toBe('pnpm test:package')
    expect(build.index).toBeLessThan(guard.index)
    expect(guard.index).toBeLessThan(publint.index)
  })
})
