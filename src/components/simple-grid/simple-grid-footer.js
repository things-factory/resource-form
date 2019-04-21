import { LitElement, html, css } from 'lit-element'

class SimpleGridFooter extends LitElement {
  constructor() {
    super()

    this.columns = []
    this.data = []
  }

  static get properties() {
    return {
      columns: Array,
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

          line-height: var(--grid-header-height, 32px);
        }

        span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `
    ]
  }

  render() {
    return html``
  }
}

customElements.define('simple-grid-fotter', SimpleGridFooter)
