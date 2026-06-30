import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('simulador-bd.open', () => {
      SimuladorPanel.createOrShow(context.extensionUri)
    })
  )
}

export function deactivate() {}

class SimuladorPanel {
  static currentPanel: SimuladorPanel | undefined
  static readonly viewType = 'simuladorBD'

  private readonly _panel: vscode.WebviewPanel
  private readonly _extensionUri: vscode.Uri
  private readonly _disposables: vscode.Disposable[] = []

  static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor?.viewColumn

    if (SimuladorPanel.currentPanel) {
      SimuladorPanel.currentPanel._panel.reveal(column)
      return
    }

    const panel = vscode.window.createWebviewPanel(
      SimuladorPanel.viewType,
      'Simulador de Carga de BD',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
        retainContextWhenHidden: true,
      }
    )

    SimuladorPanel.currentPanel = new SimuladorPanel(panel, extensionUri)
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel
    this._extensionUri = extensionUri
    this._panel.webview.html = this._getHtml()
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
  }

  dispose() {
    SimuladorPanel.currentPanel = undefined
    this._panel.dispose()
    while (this._disposables.length) {
      this._disposables.pop()?.dispose()
    }
  }

  private _getHtml(): string {
    const mediaUri = vscode.Uri.joinPath(this._extensionUri, 'media')
    const htmlPath = path.join(mediaUri.fsPath, 'simulator.html')
    let html = fs.readFileSync(htmlPath, 'utf-8')

    // Convert ./assets/ paths to VS Code webview URIs
    const mediaWebUri = this._panel.webview.asWebviewUri(mediaUri).toString()
    html = html.replace(/\.\/(assets\/)/g, `${mediaWebUri}/$1`)

    // Inject Content Security Policy
    const csp = [
      `default-src 'none'`,
      `script-src ${this._panel.webview.cspSource} 'unsafe-inline' 'unsafe-eval'`,
      `style-src ${this._panel.webview.cspSource} 'unsafe-inline'`,
      `img-src ${this._panel.webview.cspSource} data: https: blob:`,
      `font-src ${this._panel.webview.cspSource} data:`,
      `connect-src https: wss:`,
      `worker-src blob:`,
    ].join('; ')

    // Fix h-screen layout in VS Code WebView: 100vh may exceed the real panel
    // height, clipping sidebar content. Using percentage height fixes it.
    const heightFix = `<style>
      html, body { height: 100% !important; margin: 0; overflow: hidden; }
      #simulator-root { height: 100% !important; }
      .h-screen { height: 100% !important; }
    </style>`

    html = html.replace(
      '<head>',
      `<head>\n  <meta http-equiv="Content-Security-Policy" content="${csp}">\n  ${heightFix}`
    )

    return html
  }
}
