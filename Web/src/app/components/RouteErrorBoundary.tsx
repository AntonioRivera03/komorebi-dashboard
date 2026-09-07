import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'

type Props = { children: ReactNode; resetKey: string }
type State = { error: Error | null }

/** Each route group renders inside its own boundary so one failing page never blanks the shell. */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route failed', error, info.componentStack)
  }

  componentDidUpdate(previous: Props) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '60px 0' }}>
          <EmptyState glyph="!" title="This page ran into a problem" action={<Button onClick={() => this.setState({ error: null })}>Try again</Button>}>
            {this.state.error.message}. The rest of Komorebi is still available.
          </EmptyState>
        </div>
      )
    }
    return this.props.children
  }
}
