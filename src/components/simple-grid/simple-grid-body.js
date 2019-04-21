import { LitElement, html, css } from 'lit-element'

class SimpleGridBody extends LitElement {
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
          display: grid;
          grid-template-columns: var(--grid-template-columns);
          grid-auto-rows: var(--grid-record-height, 32px);

          overflow: auto;
        }

        span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          height: var(--grid-record-height, 32px);
        }
      `
    ]
  }

  render() {
    return html`
      ${(this.data && this.data.length > 0 ? this.data : [{}]).map(
        record => html`
          ${this.columns.map(
            column =>
              html`
                <span>${record[column.name]}</span>
              `
          )}
        `
      )}
    `
  }
}

customElements.define('simple-grid-body', SimpleGridBody)
