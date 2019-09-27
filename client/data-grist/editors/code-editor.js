import { html } from 'lit-element'
import gql from 'graphql-tag'
import '@material/mwc-icon'

import { client } from '@things-factory/shell'
import { InputEditor } from '@things-factory/grist-ui'

const FETCH_COMMON_CODE_GQL = codeName => gql`
{
  commonCode(name: "${codeName}") {
    details {
      name
      description
      rank
    }
  }
}
`

export class CodeEditor extends InputEditor {
  async firstUpdated() {
    super.firstUpdated()

    var { codeName, codes } = this.column.record || {}

    if (!codes && codeName) {
      /* codeName으로 fetch 해와서, this.column.record.codes에 보관한다. */
      var response = await client.query({
        query: FETCH_COMMON_CODE_GQL(codeName)
      })

      var commonCode = response && response.data && response.data.commonCode

      if (commonCode) {
        this.column.record.codes = [{ name: '', description: '' }].concat(
          commonCode.details.sort(function(a, b) {
            return a.rank - b.rank
          })
        )

        this.requestUpdate()
      }
    }
  }

  get editorTemplate() {
    var { codes } = this.column.record || {}

    return html`
      <select>
        ${(codes || ['']).map(
          code => html`
            <option ?selected=${code.name == this.value} value=${code.name}
              >${code.name}${code.description ? ` - ${code.description}` : ''}</option
            >
          `
        )}
      </select>
    `
  }
}

customElements.define('code-editor', CodeEditor)
