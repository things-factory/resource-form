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
          background-color: var(--grid-record-background-color, white);
          padding:7px 5px;
          border-bottom: 1px solid rgba(0,0,0,.1);

          font-size: var(--grid-record-wide-fontsize);
          text-overflow: ellipsis;
        }

        span[odd] {
          background-color: var(--grid-record-odd-background-color, #eee);
        }
      `
    ]
  }

  render() {
    var data = this.data || []

    return html`
      ${data.map(
        (record, i) => html`
          ${this.columns.map(
            column =>
              html`
                <span ?odd=${i % 2}>${record[column.name]}</span>
              `
          )}
          <span ?odd=${i % 2}></span>
        `
      )}
    `
  }
}

customElements.define('simple-grid-body', SimpleGridBody)
