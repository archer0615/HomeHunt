import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StatusView } from './StatusView';
interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('HomeHunt application error', error, info);
  }
  render() {
    return this.state.hasError ? (
      <StatusView
        title="HomeHunt 暫時無法顯示"
        message="請重新整理頁面後再試一次。"
        actionLabel="重新整理"
        onAction={() => window.location.reload()}
      />
    ) : (
      this.props.children
    );
  }
}
