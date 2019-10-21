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
      select: Array,
      list: Object,
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

  render() {
    return html`
      <form
        class="multi-column-form"
        id="search-form"
        @keypress=${async e => {
          if (e.keyCode === 13) {
            this.data = await this.grist.fetch()
          }
        }}
      >
        <fieldset>
          ${this.select && this.select.length > 0
            ? html`
                ${this.select
                  .filter(selectField => !selectField.hidden && (!selectField.type || selectField.type === 'string'))
                  .map(
                    selectField => html`
                      <label>${i18next.t(`field.${selectField.name}`)}</label>
                      <input name="${selectField.name}" />
                    `
                  )}
              `
            : html`
                <label>${i18next.t('field.name')}</label>
                <input name="name" />

                <label>${i18next.t('field.description')}</label>
                <input name="description" />
              `}
        </fieldset>

        <mwc-icon
          search
          @click="${async () => {
            this.data = await this.grist.fetch()
          }}}"
          >search</mwc-icon
        >
      </form>

      <data-grist
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .config=${this.config}
        .data=${this.data}
        .fetchHandler="${this.fetchHandler.bind(this)}"
        .selectedRecords=${this.selectedRecords}
      ></data-grist>

      <div class="button-container">
        <mwc-button @click=${this.oncancel.bind(this)}>${i18next.t('button.cancel')}</mwc-button>
        <mwc-button @click=${this.onconfirm.bind(this)}>${i18next.t('button.confirm')}</mwc-button>
      </div>
    `
  }

  get grist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  oncancel(e) {
    history.back()
  }

  onconfirm(e) {
    this.confirmCallback && this.confirmCallback(this.selected)
    history.back()
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          ${this.queryName} (${gqlBuilder.buildArgs(this._buildConditions(page, limit, sorters))}) {
            ${this.getSelectFields()}
          }
        }
      `
    })

    if (!response.errors) {
      const records = response.data[this.queryName].items.map(item => {
        if (this.value === item.id) {
          this.selectedRecords = [item]
          item['__selected__'] = true
        }

        return item
      })
      const total = response.data[this.queryName].total

      return {
        records,
        total,
        limit,
        page
      }
    }
  }

  async firstUpdated() {
    this.config = {
      list: {
        fields: ['palletId', 'product', 'bizplace', 'location']
      },
      columns: [
        {
          type: 'gutter',
          gutterName: 'sequence'
        },
        {
          type: 'gutter',
          gutterName: 'row-selector',
          multiple: false
        }
      ],
      rows: {
        selectable: {
          multiple: false
        },
        handlers: {
          click: 'select-row',
          dblclick: (columns, data, column, record, rowIndex, field) => {
            this.onconfirm()
          }
        },
        appendable: false
      }
    }

    if (this.select && this.select.length > 0) {
      this.config = {
        ...this.config,
        columns: [
          ...this.config.columns,
          ...this.select.map(selectField => {
            return {
              ...selectField,
              type: selectField.type ? selectField.type : 'string',
              width: selectField.width ? selectField.width : 160,
              header: selectField.header ? selectField.header : i18next.t(`field.${selectField.name}`)
            }
          })
        ]
      }
    } else {
      this.config = {
        ...this.config,
        columns: [
          ...this.config.columns,
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
        ]
      }
    }

    this.config = {
      ...this.config,
      list: {
        ...this.list,
        fields:
          this.list && this.list.fields && this.list.fields.length > 0
            ? this.list.fields
            : this.config.columns
                .filter(column => column.type !== 'gutter')
                .slice(0, 3)
                .map(column => column.name)
      }
    }

    await this.updateComplete
    this.grist && this.grist.focus()
  }

  getSelectFields() {
    if (this.select && this.select.length > 0) {
      return `items {
        ${this.select.map(selectField => {
          return selectField.type === 'object'
            ? `${selectField.name} { ${
                selectField.subFields && selectField.subFields.length > 0
                  ? selectField.subFields.join(' ')
                  : `id name description`
              } }`
            : `${selectField.name}`
        })}
      }
      total`
    } else {
      return `
        items {
          id
          name
          description
        }
        total
      `
    }
  }

  _buildConditions(page, limit, sorters) {
    const queryConditions = {
      filters: [],
      ...this.basicArgs
    }

    queryConditions.filters = [...queryConditions.filters, ...this.serializeFormData()]
    queryConditions.pagination = { page, limit }
    queryConditions.sortings = sorters
    return queryConditions
  }

  serializeFormData() {
    const searchInputs = Array.from(this.shadowRoot.querySelectorAll('#search-form input'))
    return searchInputs
      .filter(input => input.value)
      .map(input => {
        return { name: input.name, operator: 'i_like', value: `%${input.value}%` }
      })
  }

  get selected() {
    var grist = this.shadowRoot.querySelector('data-grist')

    var selected = grist.selected

    return selected && selected.length > 0 ? selected[0] : undefined
  }
}

customElements.define('object-selector', ObjectSelector)
