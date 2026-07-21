import { Component } from "react";
import { AlertOctagon } from "lucide-react";

/**
 * Catches genuinely unexpected render-time errors (as opposed to API/data
 * errors, which each page already handles via ErrorState). React requires
 * this to be a class component - there is no hook equivalent for
 * componentDidCatch. Wraps the page Outlet in AppLayout so one page
 * crashing never takes down the sidebar/navigation with it.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Deliberately no console output here - this project maintains a
    // zero-console-statements policy end to end (verified in every Sprint
    // audit so far). A production deployment would report to an error
    // tracking service at this exact point instead; the caught error is
    // still fully handled via the fallback UI below regardless.
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-card border border-risk-critical/30 bg-risk-critical/5 px-6 text-center"
        >
          <AlertOctagon size={20} className="text-risk-critical" aria-hidden="true" />
          <p className="text-sm text-risk-critical">
            Something unexpected went wrong while rendering this page.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-md border border-risk-critical/30 px-3 py-1.5 text-xs font-medium text-risk-critical transition-colors hover:bg-risk-critical/10"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}