import { html } from 'lit-html'

import { store } from '@things-factory/shell'
import { addRoutingType } from '@things-factory/menu-base'

import { TOOL_POSITION } from '@things-factory/layout-base'
import { APPEND_CONTEXT_TOOL } from '@things-factory/context-base'

export default function bootstrap() {
  import('./components/page-action-context-bar')
  store.dispatch(addRoutingType('RESOURCE', 'resource'))

  store.dispatch({
    type: APPEND_CONTEXT_TOOL,
    tool: {
      template: html`
        <page-action-context-bar></page-action-context-bar>
      `,
      position: TOOL_POSITION.REAR_END,
      context: 'actions'
    }
  })

  import('@things-factory/grist-ui').then(grist => {
    import('./data-grist/renderers/object-renderer').then(renderer => {
      grist.registerRenderer('object', renderer.ObjectRenderer)
    })
    import('./data-grist/editors/object-editor').then(editor => {
      grist.registerEditor('object', editor.ObjectEditor)
    })
  })
}
