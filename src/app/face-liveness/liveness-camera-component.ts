import { Component, ElementRef, Input, OnDestroy, OnInit, Output, ViewChild, EventEmitter } from "@angular/core";
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import '@aws-amplify/ui-react/styles.css'; // Estilos obrigatórios do componente da

@Component({
  selector: 'app-liveness-camera',
  standalone: true,
  template: `<div #reactContainer class="liveness-wrapper"></div>`
})
export class LivenessCameraComponent implements OnInit, OnDestroy {
  @ViewChild('reactContainer', { static: true }) reactContainer!: ElementRef;
  
  @Input() sessionId!: string;
  @Output() analysisComplete = new EventEmitter<any>();
  @Output() error = new EventEmitter<any>();

  private root!: Root;

  ngOnInit() {
    //Garantir que o React seja renderizado apenas uma vez
    if (typeof window!=='undefined') {
      this.root = createRoot(this.reactContainer.nativeElement);
      this.renderReactComponent();
    }
  }

  ngOnDestroy() {
    if (this.root) {
      this.root.unmount(); //Desmonta a camera limpamente
    }
  }

  private renderReactComponent() {
    this.root.render(
      React.createElement(FaceLivenessDetector, {
        sessionId: this.sessionId,
        region: 'us-east-1', // A API de Liveness NÃO é suportada em sa-east-1, deve coincidir com o backend (us-east-1)
        onAnalysisComplete: async () => {
          this.analysisComplete.emit();
        },
        onError: (error: any) => {
          this.error.emit(error);
        }
      })
    )
  }
}
