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

type PerformanceWorkflow = {
  concurrency: {
    'cancel-in-progress': boolean
    'group': string
  }
  jobs: {
    compare: {
      'runs-on': string
      'steps': WorkflowStep[]
    }
  }
  name: string
  on: {
    pull_request: {
      branches: string[]
      paths: string[]
    }
    workflow_dispatch: {
      inputs: {
        baseline_ref: {
          default: string
          description: string
          required: boolean
        }
      }
    }
  }
  permissions: { contents: string }
}

function findStep(steps: WorkflowStep[], name: string) {
  const step = steps.find(step => step.name === name)

  expect(step, `expected a ${name} step`).toBeDefined()
  return step!
}

function readWorkflow() {
  return parse(readFileSync('.github/workflows/performance.yml', 'utf8')) as PerformanceWorkflow
}

describe('performance workflow', () => {
  it('runs for relevant pull-request changes and manual baseline comparisons', () => {
    const workflow = readWorkflow()

    expect(workflow.name).toBe('performance')
    expect(workflow.on).toEqual({
      pull_request: {
        branches: ['main'],
        paths: [
          'src/**',
          'bench/**',
          'scripts/**',
          'test/**',
          'package.json',
          'pnpm-lock.yaml',
          '.github/workflows/performance.yml',
        ],
      },
      workflow_dispatch: {
        inputs: {
          baseline_ref: {
            description: 'Git ref to compare against',
            required: true,
            default: 'v2.0.0',
          },
        },
      },
    })
    expect(workflow.permissions).toEqual({ contents: 'read' })
    expect(workflow.concurrency).toEqual({
      'group': 'performance-${{ github.ref }}',
      'cancel-in-progress': true,
    })
  })

  it('compares the pull-request base and candidate in separate directories', () => {
    const workflow = readWorkflow()
    expect(workflow.jobs.compare['runs-on']).toBe('ubuntu-latest')
    const steps = workflow.jobs.compare.steps

    const baselineRef = findStep(steps, 'Resolve baseline ref')
    expect(baselineRef).toMatchObject({
      id: 'baseline',
      env: {
        PR_BASE_SHA: '${{ github.event.pull_request.base.sha }}',
        INPUT_BASELINE_REF: '${{ inputs.baseline_ref }}',
      },
    })
    expect(baselineRef.run).toBe('echo "ref=${PR_BASE_SHA:-$INPUT_BASELINE_REF}" >> "$GITHUB_OUTPUT"')

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
  })

  it('installs, builds, captures, and compares the paired module versions', () => {
    const steps = readWorkflow().jobs.compare.steps

    expect(steps.find(step => step.uses?.startsWith('pnpm/action-setup@'))).toMatchObject({
      uses: 'pnpm/action-setup@f40ffcd9367d9f12939873eb1018b921a783ffaa',
      with: {
        package_json_file: 'candidate/package.json',
      },
    })
    expect(steps.find(step => step.uses?.startsWith('actions/setup-node@'))).toMatchObject({
      uses: 'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020',
      with: {
        'node-version': '24.14.0',
        'cache': 'pnpm',
        'cache-dependency-path': 'candidate/pnpm-lock.yaml',
      },
    })

    expect(findStep(steps, 'Install baseline').run).toBe('pnpm --dir baseline install --frozen-lockfile')
    expect(findStep(steps, 'Install candidate').run).toBe('pnpm --dir candidate install --frozen-lockfile')
    expect(findStep(steps, 'Prepare baseline').run).toBe('pnpm --dir baseline dev:prepare')
    expect(findStep(steps, 'Prepare candidate').run).toBe('pnpm --dir candidate dev:prepare')
    expect(findStep(steps, 'Build baseline package').run).toBe('pnpm --dir baseline prepack')
    expect(findStep(steps, 'Build candidate package').run).toBe('pnpm --dir candidate prepack')
    expect(steps.findIndex(step => step.name === 'Install baseline')).toBeLessThan(
      steps.findIndex(step => step.name === 'Prepare baseline'),
    )
    expect(steps.findIndex(step => step.name === 'Prepare baseline')).toBeLessThan(
      steps.findIndex(step => step.name === 'Build baseline package'),
    )
    expect(steps.findIndex(step => step.name === 'Install candidate')).toBeLessThan(
      steps.findIndex(step => step.name === 'Prepare candidate'),
    )
    expect(steps.findIndex(step => step.name === 'Prepare candidate')).toBeLessThan(
      steps.findIndex(step => step.name === 'Build candidate package'),
    )
    expect(findStep(steps, 'Capture baseline').run).toBe(
      'node candidate/bench/run.mjs --root baseline --label baseline --output candidate/.bench/baseline.json --runs 20 --prepare-runs 5',
    )
    expect(findStep(steps, 'Capture candidate').run).toBe(
      'node candidate/bench/run.mjs --root candidate --label candidate --output candidate/.bench/candidate.json --runs 20 --prepare-runs 5',
    )

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
