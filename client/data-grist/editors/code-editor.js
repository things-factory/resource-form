import { html } from 'lit-element'
import gql from 'graphql-tag'
import '@material/mwc-icon'

import { client } from '@things-factory/shell'
import { InputEditor } from '@things-factory/grist-ui'

/* 
  TODO
  - 코드리스트 fetch 후에 어떻게 템플릿에 반영할까 ? 
    - 셀렉트가 최초에 열리는 시점에 fetch한다면, update할 수 있는 방법이 필요하다.
    - 셀렉트가 열리기 전에 fetch한다면, (사용자가) 에디터를 다시 열어서 반영할 수도 있겠다. (언제 어떻게 fetch를 트리거링 할 수 있느냐가 관건.)
  - 최초에 fetch해 온 코드를 어디에 저장해두고 공유할까 ?
  - 코드 공유는 어느 단위 안에서 할까 ? 그리드 컬럼 단위. 따라서, 컬럼에 데이터 저장 및 사용을 위한 방법 제공이 필요하다.
    - this.column.options._codes = ...
  - 어느 시점에 코드를 refetch할까 ? 그리드가 새로 만들어질 때 ? 그리드가 새로 configuration 될 때 ?
  - 다국어는 어떻게 처리할까 ? 코드 디스크립션이 언어에 따라서 정의되지 않으므로 다국어는 생각하지 않는다.
*/

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
  async fetchCode(codeName) {
    var response = await client.query({
      query: FETCH_COMMON_CODE_GQL(codeName)
    })

    if (response) {
      this.column.record.codes = response.data.details.sort(function(a, b) {
        return a.rank - b.rank
      })
    }
  }

  get editorTemplate() {
    var { codeName, codes } = this.column.record || {}

    if (!codes && codeName) {
      /* 1. codeName으로 fetch 해와서, this.column.record.codes에 보관한다. */
      this.fetchCode(codeName)
    }

    return html`
      <select>
        ${(codes || ['']).map(
          code => html`
            <option ?selected=${code.name == this.value}>${code.name} - ${code.description}</option>
          `
        )}
      </select>
    `
  }
}

customElements.define('code-editor', CodeEditor)
