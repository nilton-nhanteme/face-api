import { Component, ElementRef, Input, OnDestroy, OnInit, Output, ViewChild, EventEmitter } from "@angular/core";
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';

@Component({
  selector: 'app-liveness-camera',
  standalone: true,
  template: `<div #reactContainer class="liveness-inline"></div>`,
  styles: [`
    .liveness-inline {
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
    }
  `]
})
export class LivenessCameraComponent implements OnInit, OnDestroy {
  @ViewChild('reactContainer', { static: true }) reactContainer!: ElementRef;

  @Input() sessionId!: string;
  @Output() analysisComplete = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();

  private root!: Root;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.root = createRoot(this.reactContainer.nativeElement);
      this.renderReactComponent();
    }
  }

  ngOnDestroy() {
    if (this.root) {
      this.root.unmount();
    }
  }

  private renderReactComponent() {
    this.root.render(
      React.createElement(FaceLivenessDetector, {
        sessionId: this.sessionId,
        region: 'us-east-1',
        onAnalysisComplete: async () => {
          this.analysisComplete.emit();
        },
        onError: (error: any) => {
          this.error.emit(error);
        }
      })
    );
  }
}
