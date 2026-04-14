import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, EventEmitter } from "@angular/core";
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
      height: 100%; /* Força a ocupar a altura do container */
      border-radius: 28px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: transparent !important;
    }
    
    /* Disfarça eventuais bordas e fundos agressivos do componente Amplify React */
    ::ng-deep [data-amplify-liveness="true"],
    ::ng-deep .amplify-liveness {
      flex: 1;
      height: 100% !important;
      background: transparent !important;
      background-color: transparent !important;
      border-radius: 28px !important;
      overflow: hidden !important;
      box-shadow: none !important;
      border: none !important;
    }
    
    /* Remove as caixas cinzentas/pretas do fundo do player da AWS */
    ::ng-deep .amplify-liveness-container,
    ::ng-deep .amplify-liveness-video-container {
      background: transparent !important;
      background-color: transparent !important;
    }
    
    /* Estilização Glassmorphism para os Toasts/Alertas/Instruções da AWS */
    ::ng-deep .amplify-liveness-toast,
    ::ng-deep .amplify-alert,
    ::ng-deep .amplify-liveness-instruction-container,
    ::ng-deep .amplify-liveness-instruction {
      background: rgba(20, 20, 20, 0.6) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.15) !important;
      border-radius: 20px !important;
      color: #ffffff !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      font-weight: 500 !important;
      text-align: center !important;
      padding: 12px 20px !important;
    }

    ::ng-deep .amplify-liveness-toast *,
    ::ng-deep .amplify-alert * {
      color: #ffffff !important;
    }
    
    /* Elimina APENAS o alerta de fotossensibilidade inicial (que usa variation info) */
    ::ng-deep .amplify-alert[data-variation="info"] {
      display: none !important;
    }
  `]
})
export class LivenessCameraComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('reactContainer', { static: true }) reactContainer!: ElementRef;

  @Input() sessionId!: string;
  @Output() analysisComplete = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();
  @Output() userCancel = new EventEmitter<void>();

  private root!: Root;

  ngOnInit() {
    if (typeof window !== 'undefined') {
      this.root = createRoot(this.reactContainer.nativeElement);
      this.renderReactComponent();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sessionId'] && !changes['sessionId'].firstChange && this.root) {
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
        },
        onUserCancel: () => {
          this.userCancel.emit();
        },
        components: {
          PhotosensitiveWarning: () => null
        }
      })
    );
  }
}
