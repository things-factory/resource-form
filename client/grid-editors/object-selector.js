import { i18next } from '@things-factory/i18n-base'
import { client, isMobileDevice, gqlBuilder } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import './node_modules/@things-factory/grist-ui'

export class ObjectSelector extends LitElement {
  static get properties() {
    return {
      value: String,
      config: Object,
      data: Object,
      queryName: String,
      basicArgs: Object,
      confirmCallback: Object,
      selectedRecords: Array
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        overflow-x: auto;

        padding: 5px;

        background-color: #fff;
      }

      form {
        position: relative;
      }

      .grist {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      data-grist {
        overflow-y: hidden;
        flex: 1;
      }

      .button-container {
        display: flex;
        margin-left: auto;
      }

      [search] {
        position: absolute;
        right: 0;
      }
    `
  }

  get context() {
    return {
      title: i18next.t('title.confirm_arrival_notice')
    }
  }

  render() {
    return html`
      <form
        id="search-form"
        @keypress="${async e => {
          if (e.keyCode === 13) {
            this.data = await this.getData()
          }
        }}"
      >
        <label>${i18next.t('label.name')}</label>
        <input name="name" />

        <label>${i18next.t('label.description')}</label>
        <input name="description" />

        <mwc-icon
          search
          @click="${async () => {
            this.data = await this.getData()
          }}}"
          >search</mwc-icon
        >
      </form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .data=${this.data}
        .selectedRecords=${this.selectedRecords}
      ></data-grist>

      <div class="button-container">
        <mwc-button @click=${this.oncancel.bind(this)}>${i18next.t('button.cancel')}</mwc-button>
        <mwc-button @click=${this.onconfirm.bind(this)}>${i18next.t('button.confirm')}</mwc-button>
      </div>
    `
  }

  oncancel(e) {
    history.back()
  }

  onconfirm(e) {
    this.confirmCallback && this.confirmCallback(this.selected)
    history.back()
  }

  async firstUpdated() {
    this.config = {
      columns: [
        {
          type: 'gutter',
          name: 'sequence'
        },
        {
          type: 'gutter',
          name: 'row-selector',
          multiple: false
        },
        {
          type: 'string',
          name: 'id',
          header: i18next.t('field.id'),
          hidden: true
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 160
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: {
            align: 'left'
          },
          sortable: true,
          width: 300
        }
      ],
      pagination: {
        infinite: true
      }
    }

    this.data = await this.getData()

    var selected = this.data.records.find(item => this.value == item.id)
    if (selected) {
      this.selectedRecords = [selected]
    }
  }

  async getData() {
    const response = await client.query({
      query: gql`
        query {
          ${this.queryName} (${gqlBuilder.buildArgs(this._buildConditions())}) {
            items {
              id
              name
              description
            }
            total
          }
        }
      `
    })

    return {
      records: response.data[this.queryName].items,
      total: response.data[this.queryName].total,
      limit: 100,
      page: 1
    }
  }

  _buildConditions() {
    const queryConditions = {
      filters: [],
      ...this.basicArgs
    }

    queryConditions.filters = [...queryConditions.filters, ...this.serializeFormData()]
    return queryConditions
  }

  serializeFormData() {
    const searchInputs = Array.from(this.shadowRoot.querySelectorAll('#search-form > input'))
    return searchInputs
      .filter(input => input.value)
      .map(input => {
        return { name: input.name, operator: 'like', value: input.value }
      })
  }

  get selected() {
    var grist = this.shadowRoot.querySelector('data-grist')

    var selected = grist.selected

    return selected && selected.length > 0 ? selected[0] : undefined
  }
}

customElements.define('object-selector', ObjectSelector)
