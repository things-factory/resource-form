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

  updated(changes) {
    //if there are changes in page, then dispatch page-changed from simple-list
    if (changes.has('page')) {
      this.dispatchEvent(
        new CustomEvent('page-changed', {
          detail: this.page
        })
      )
    }

    if (changes.has('data')) {
      if (this.data && this.data.items) {
        this._totalData = (this._totalData || []).concat(this.data.items)
        this.requestUpdate()
      }
    }
  }

  render() {
    if (!this.columns || this.columns.length === 0) return

    const columns = this.columns.filter(column => {
      return Number(column.gridWidth) && !column.hiddenFlag
    })

    return html`
      ${(this._totalData || []).map(
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
