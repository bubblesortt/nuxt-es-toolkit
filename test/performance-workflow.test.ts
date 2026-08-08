import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

type WorkflowStep = {
  env?: Record<string, string>
  id?: string
  if?: string
  name?: string
  run?: string
  uses?: string
  with?: Record<string, string>
}

function findStep(steps: WorkflowStep[], name: string) {
  const step = steps.find(step => step.name === name)

  expect(step, `expected a ${name} step`).toBeDefined()
  return step!
}

describe('performance workflow', () => {
  it('compares the pull-request base and candidate in separate directories', () => {
    const workflow = parse(readFileSync('.github/workflows/performance.yml', 'utf8')) as {
      jobs: { compare: { steps: WorkflowStep[] } }
    }
    const steps = workflow.jobs.compare.steps

    const baselineRef = findStep(steps, 'Resolve baseline ref')
    expect(baselineRef).toMatchObject({
      id: 'baseline',
      env: {
        PR_BASE_SHA: '${{ github.event.pull_request.base.sha }}',
        INPUT_BASELINE_REF: '${{ inputs.baseline_ref }}',
      },
    })

    expect(findStep(steps, 'Checkout baseline')).toMatchObject({
      uses: 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
      with: {
        ref: '${{ steps.baseline.outputs.ref }}',
        path: 'baseline',
      },
    })
    expect(findStep(steps, 'Checkout candidate')).toMatchObject({
      uses: 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
      with: { path: 'candidate' },
    })
    expect(findStep(steps, 'Checkout candidate').with?.ref).toBeUndefined()

    expect(findStep(steps, 'Compare results').run).toBe(
      'node candidate/bench/compare.mjs --baseline candidate/.bench/baseline.json --candidate candidate/.bench/candidate.json --profile v2.1 | tee -a "$GITHUB_STEP_SUMMARY"',
    )
    expect(findStep(steps, 'Upload results')).toMatchObject({
      if: 'always()',
      uses: 'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02',
      with: {
        name: 'performance-results',
        path: 'candidate/.bench/*.json',
      },
    })
  })
})
