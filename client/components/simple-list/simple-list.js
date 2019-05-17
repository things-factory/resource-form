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
        }

        .item {
          padding: 5px 15px 5px 15px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .name {
          font-size: 1.2em;
          font-weight: bold;
        }

        .desc {
          font-size: 0.8em;
          color: gray;
        }

        .update-info {
          font-size: 0.8em;
          color: black;
        }
      `
    ]
  }

  updated(changes) {}

  render() {
    var columns = this.columns.filter(column => column.gridWidth)
    var data = (this.data && this.data.items) || []

    return html`
      ${data.map(
        record => html`
          <div class="item">
            <div class="name">${record[columns[0].name]}</div>
            <div class="desc">${record[columns[1].name]}</div>
            ${record.updatedAt
              ? html`
                  <div class="update-info">Updated At : ${record.updatedAt} / ${record.updaterId}</div>
                `
              : ``}
          </div>
        `
      )}
    `
  }
}

customElements.define('simple-list', SimpleList)
