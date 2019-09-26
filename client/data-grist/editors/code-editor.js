import { LitElement, html, css } from 'lit-element'

import '@material/mwc-icon'

export class CodeEditor extends LitElement {
  static get properties() {
    return {
      value: Object,
      column: Object,
      record: Object,
      row: Number
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-flow: row nowrap;

        padding: 7px 0px;
        box-sizing: border-box;

        width: 100%;
        height: 100%;

        border: 0;
        background-color: transparent;

        font: var(--grist-code-editor-font);
        color: var(--grist-code-editor-color);
        justify-content: inherit;
      }

      span {
        display: flex;
        flex: auto;

        justify-content: inherit;
      }

      mwc-icon {
        width: 20px;
        font-size: 1.5em;
        margin-left: auto;
      }
    `
  }

  render() {
    var value = this.value

    return html`
      ${!value
        ? html``
        : html`
            <span>value</span>
          `}
      <mwc-icon>arrow_drop_down</mwc-icon>
    `
  }

  firstUpdated() {
    this.value = this.record[this.column.name]
    this.template = ((this.column.record || {}).options || {}).template

    this.addEventListener('click', e => {
      e.stopPropagation()

      this.openSelector()
    })
  }

  openSelector() {}
}

customElements.define('code-editor', CodeEditor)
