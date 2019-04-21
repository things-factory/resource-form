import { LitElement, html, css } from 'lit-element'

class SimpleList extends LitElement {
  constructor() {
    super()

    this.columns = []
    this.data = []
  }

  static get properties() {
    return {
      columns: Array,
      data: Array,
      limit: Number,
      page: Number
    }
  }

  static get styles() {
    return [
      css`
        :host {
          overflow: auto;
          padding: 5px;
        }

        .item {
          margin: 5px;

          border-bottom: solid 1px #ccc;
        }

        .name {
          font-size: 1.2em;
          font-weight: bold;
        }

        .desc {
          font-size: 0.8em;
          color: gray;
        }

        .updated-at {
          font-size: 0.8em;
          color: black;
        }
      `
    ]
  }

  updated(changes) {}

  render() {
    var columns = this.columns.filter(column => column.grid_width)
    var data = (this.data && this.data.items) || []

    return html`
      ${data.map(
        record => html`
          <div class="item">
            <div class="name">${record[columns[0].name]}</div>
            <div class="desc">${record[columns[1].name]}</div>
            ${record.updated_at
              ? html`
                  <div class="updated-at">Updated At : ${record.updated_at} / ${record.updater_id}</div>
                `
              : ``}
          </div>
        `
      )}
    `
  }
}

customElements.define('simple-list', SimpleList)
