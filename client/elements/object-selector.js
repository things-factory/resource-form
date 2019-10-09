import { i18next } from '@things-factory/i18n-base'
import { client, isMobileDevice, gqlBuilder } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'
import { MultiColumnFormStyles } from '@things-factory/form-ui'
import '@things-factory/grist-ui'

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
    return [
      MultiColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          background-color: #fff;
        }

        data-grist {
          flex: 1;
        }

        .button-container {
          display: flex;
          margin-left: auto;
        }

        form {
          position: relative;
        }

        [search] {
          position: absolute;
          right: 0;
        }
      `
    ]
  }

  get context() {
    return {
      title: i18next.t('title.confirm_arrival_notice')
    }
  }

  render() {
    return html`
      <form
        class="multi-column-form"
        id="search-form"
        @keypress=${async e => {
          if (e.keyCode === 13) {
            this.data = await this.getData()
          }
        }}
      >
        <fieldset>
          <label>${i18next.t('field.name')}</label>
          <input name="name" />

          <label>${i18next.t('field.description')}</label>
          <input name="description" />
        </fieldset>

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
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'row-selector',
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
      rows: {
        selectable: {
          multiple: false
        },
        handlers: {
          click: 'select-row'
        },
        appendable: false
      },
      pagination: {
        infinite: true
      }
    }

    this.data = await this.getData()

    var selected = this.data.records.find(item => this.value == item.id)
    if (selected) {
      this.selectedRecords = [selected]
    }

    await this.updateComplete
    var grist = this.shadowRoot.querySelector('data-grist')
    grist && grist.focus()
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
