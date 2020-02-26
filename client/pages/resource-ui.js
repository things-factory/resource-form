import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import gql from 'graphql-tag'

import { client, PageView, store } from '@things-factory/shell'
import { gqlBuilder, isMobileDevice } from '@things-factory/utils'
import { ScrollbarStyles } from '@things-factory/styles'
import { i18next } from '@things-factory/i18n-base'
import '@things-factory/form-ui'

import '../data-grist/wrapper/data-list-wrapper'

function underToCamel(str) {
  if (str.indexOf('_') > 0) {
    const strArr = str.split('_')
    str = strArr
      .map((str, idx) => {
        if (idx > 0) {
          str = str.replace(str[0], str[0].toUpperCase())
        }

        return str
      })
      .join('')
  }

  return str
}

class ResourceUI extends connect(store)(PageView) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        search-form {
          overflow: visible;
        }

        data-list-wrapper {
          flex: 1;

          overflow: hidden;
        }
      `
    ]
  }

  static get properties() {
    return {
      resourceId: String,
      _searchFields: Array,
      _columns: Array
    }
  }

  get context() {
    return {
      title: this.menuTitle,
      exportable: {
        name: this.menuTitle,
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: () => {}
      },
      printable: {
        accept: ['paper', 'preview'],
        content: () => {
          return this
        }
      },
      actions: (this.buttons || []).map(button => {
        return {
          title: button.text,
          action: button.action
        }
      })
    }
  }

  firstUpdated() {
    /*
     * TODO 다국어 언어 변화에 대한 대응으로 적절한 지 확인해야함.
     * 다국어 파일이 로드되기 전에 i18next.t(field.term) 이 동작한다면 다국어 동작이 완료되지 않을 수 있음.
     * 따라서, 새로운 다국어 파일이 로드된 후 _parseResourceMeta() 를 재실행 함.
     */
    i18next.store.on('added', (lng, ns) => {
      console.trace('이 메시지 발생 시 꼭 확인되어야 함.')
      this._parseResourceMeta()
    })
  }

  _exportableData() {
    return this.dataList.exportRecords()
  }

  render() {
    return html`
      <search-form
        id="search-form"
        .fields=${this._searchFields}
        initFocus="description"
        @submit=${e => this.dataList.fetch()}
      ></search-form>

      <data-list-wrapper
        pulltorefresh
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .columns=${this._columns}
        .records=${this.items}
        .fetchHandler=${this.fetchHandler.bind(this)}
      >
      </data-list-wrapper>
    `
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    if (!this.resourceUrl) {
      return
    }

    const response = await client.query({
      query: gql`
        ${this._queryBuilder({
          page,
          limit,
          sorters,
          filters: this.buildFilters()
        })}
      `
    })

    return {
      total: response.data.response.total || 0,
      page,
      limit,
      records: response.data.response.items || []
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('#search-form')
  }

  get dataList() {
    return this.shadowRoot.querySelector('data-list-wrapper')
  }

  async _getResourceData() {
    this.columns = []

    const response = await client.query({
      query: gql`
        query {
          menu(name: "${this.resourceId}") {
            name,
            resourceUrl,
            buttons {
              text
            },
            columns {
              name
              term
              colType
              colSize
              nullable
              refType
              refName
              refUrl
              refRelated
              searchRank
              sortRank
              reverseSort
              searchEditor
              searchOper
              searchInitVal
              gridRank
              gridEditor
              gridFormat
              gridValidator
              gridWidth
              gridAlign
              formEditor
              formValidator
              formFormat
              defVal
              rangeVal
              ignoreOnSave
            }
          }
        }
      `
    })

    this.menuMeta = response.data.menu
    this.menuTitle = this.menuMeta.name
    this.resourceUrl = underToCamel(this.menuMeta.resourceUrl)

    this.searchForm.form.reset()
    this._parseResourceMeta()

    this.updateContext()
  }

  _parseResourceMeta() {
    if (!this.menuMeta) {
      return
    }

    var metaData = this.menuMeta

    this._columns = metaData.columns
      .filter(column => column.gridRank > 0)
      .map(column => {
        column.term = i18next.t(column.term)
        return column
      })
      .sort((a, b) => {
        return a['gridRank'] > b['gridRank'] ? 1 : -1
      })

    // TODO: submit 테스트용도 서버에서 실행 로직을 전달 받을 수 있거나 resource-ui 가 직접 submit 가능 여부를 판단할 수 있도록 수정
    this.buttons = metaData.buttons //.concat({ text: 'submit', action: this._searchData.bind(this) })

    this._searchFields = metaData.columns
      .filter(field => field.searchRank && field.searchRank > 0)
      .sort((a, b) => (a['searchRank'] > b['searchRank'] ? 1 : -1))
      .map(field => {
        return {
          name: field.name,
          type: field.searchEditor ? field.searchEditor : 'text',
          props: {
            min: field.rangeVal ? field.rangeVal.split(',')[0] : null,
            max: field.rangeVal ? field.rangeVal.split(',')[1] : null,
            searchOper: field.searchOper ? field.searchOper : 'eq',
            placeholder: field.term
          },
          value: field.searchInitVal
        }
      })
  }

  _queryBuilder({ page, limit, sorters, filters }) {
    /* column 정보가 없는 경우 systax 오류를 방지하기 위해, '임시로' id를 제공함. */
    var fields =
      this._columns && this._columns.length > 0
        ? this._columns
            .map(column => {
              return column.refType == 'Entity' || column.refType == 'Menu'
                ? `${underToCamel(column.name).replace('Id', '')} { id name description }`
                : underToCamel(column.name)
            })
            .join()
        : 'id'

    const queryStr = `
    query {
      response: ${this.resourceUrl} (
        ${gqlBuilder.buildArgs({
          filters,
          pagination: { limit, page },
          sortings: sorters.map(sorter => {
            return { name: sorter.name, desc: !!sorter.descending }
          })
        })}
      ) {
        items {
          ${fields}
        }
        total
      }
    }
  `

    return queryStr
  }

  buildFilters() {
    const conditions = []

    this.searchForm.formFields.forEach(field => {
      if (field.value) {
        conditions.push({
          name: field.name,
          operator: field.getAttribute('searchOper'),
          value: field.value,
          dataType: this._columns.find(c => c.name === field.name).colType
        })
      }
    })

    return conditions
  }

  stateChanged(state) {
    this.resourceId = state.route.resourceId
  }

  updated(changed) {
    if (changed.has('resourceId')) {
      this._getResourceData()
    }
  }
}

window.customElements.define('resource-ui', ResourceUI)
