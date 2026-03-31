"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/30">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <h2 className="font-semibold mb-1">Niečo sa nepodarilo</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Skúste obnoviť stránku.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Obnoviť
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
