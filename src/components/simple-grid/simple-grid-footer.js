import { LitElement, html, css } from 'lit-element'

class SimpleGridFooter extends LitElement {
  constructor() {
    super()

    this.data = []
  }

  static get properties() {
    return {
      data: Array
    }
  }

  static get styles() {
    return [
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;

          font-size: 0.8em;
          line-height: var(--grid-footer-height, 24px);
        }

        span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          text-align: right;

          background-color: var(--grid-footer-background-color, gray);
          color: var(--grid-footer-color, white);
        }
      `
    ]
  }

  render() {
    return html`
      <span>total ${(this.data || []).length} records.</span>
    `
  }
}

customElements.define('simple-grid-footer', SimpleGridFooter)
